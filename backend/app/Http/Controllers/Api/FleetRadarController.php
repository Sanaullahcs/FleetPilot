<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Models\Driver;
use App\Models\GpsSnapshot;
use App\Models\Route;
use App\Models\Run;
use App\Models\RunAssignment;
use App\Models\Student;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class FleetRadarController extends Controller
{
    use ResolvesAccessScope;

    public function live(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $schoolScopeId = $this->schoolScopeId($request->user());
        $contractorRouteIds = $this->contractorRouteIds($request->user());
        $isContractor = $contractorRouteIds !== null;
        $contractorId = $request->user()->id;

        $vehicles = Vehicle::forOrganization($orgId)
            ->when($isContractor, fn ($q) => $q->where('contractor_id', $contractorId))
            ->when($schoolScopeId, function ($q) use ($orgId, $schoolScopeId) {
                $schoolDriverIds = Driver::forOrganization($orgId)
                    ->whereHas('students', fn ($s) => $s->where('school_id', $schoolScopeId))
                    ->pluck('id');

                $schoolVehicleIds = RunAssignment::query()
                    ->whereDate('service_date', Carbon::today())
                    ->whereNotNull('vehicle_id')
                    ->whereHas('run.route', fn ($r) => $r->where('school_id', $schoolScopeId))
                    ->pluck('vehicle_id');

                $q->where(function ($inner) use ($schoolDriverIds, $schoolVehicleIds) {
                    if ($schoolDriverIds->isNotEmpty()) {
                        $inner->whereIn('assigned_driver_id', $schoolDriverIds);
                    }
                    if ($schoolVehicleIds->isNotEmpty()) {
                        $inner->orWhereIn('id', $schoolVehicleIds);
                    }
                    if ($schoolDriverIds->isEmpty() && $schoolVehicleIds->isEmpty()) {
                        $inner->whereRaw('0 = 1');
                    }
                });
            })
            ->with([
                'assignedDriver:id,first_name,last_name,employee_id,phone,email,status,default_vehicle_id,license_number,license_class',
            ])
            ->when($request->string('status')->toString(), fn ($q, $s) => $q->where('status', $s))
            ->when($request->string('type')->toString(), fn ($q, $t) => $q->where('type', $t))
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('vehicle_number', 'like', "%{$search}%")
                        ->orWhere('license_plate', 'like', "%{$search}%")
                        ->orWhereHas('assignedDriver', function ($d) use ($search) {
                            $d->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('employee_id', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->string('assignment')->toString() === 'assigned', fn ($q) => $q->whereHas('assignedDriver'))
            ->when($request->string('assignment')->toString() === 'unassigned', fn ($q) => $q->whereDoesntHave('assignedDriver'))
            ->when($request->string('driver_status')->toString(), function ($q, $status) {
                $q->whereHas('assignedDriver', fn ($d) => $d->where('status', $status));
            })
            ->when($request->string('driver_id')->toString(), function ($q, $driverId) {
                $q->whereHas('assignedDriver', fn ($d) => $d->where('id', $driverId));
            })
            ->orderBy('vehicle_number')
            ->get();

        $driverStudentCounts = Driver::forOrganization($orgId)
            ->withCount('students')
            ->pluck('students_count', 'id');

        $routesBySchool = Route::forOrganization($orgId)
            ->with('school:id,name,code')
            ->where('status', 'active')
            ->when($schoolScopeId, fn ($q) => $q->where('school_id', $schoolScopeId))
            ->when($isContractor, fn ($q) => $q->whereIn('id', $contractorRouteIds ?: ['__none__']))
            ->get()
            ->groupBy('school_id');

        $allRoutes = Route::forOrganization($orgId)
            ->with('school:id,name,code')
            ->where('status', 'active')
            ->when($schoolScopeId, fn ($q) => $q->where('school_id', $schoolScopeId))
            ->when($isContractor, fn ($q) => $q->whereIn('id', $contractorRouteIds ?: ['__none__']))
            ->orderBy('name')
            ->get();

        $runsByRoute = Run::whereIn('route_id', $allRoutes->pluck('id'))
            ->where('status', 'active')
            ->get()
            ->groupBy('route_id');

        $todayAssignments = RunAssignment::where('service_date', Carbon::today())
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->whereHas('run.route', function ($q) use ($orgId, $schoolScopeId, $isContractor, $contractorRouteIds) {
                $q->where('organization_id', $orgId);
                if ($schoolScopeId) {
                    $q->where('school_id', $schoolScopeId);
                }
                if ($isContractor) {
                    $q->whereIn('id', $contractorRouteIds ?: ['__none__']);
                }
            })
            ->with(['run.route.school'])
            ->get();

        $routeTypeFilter = $request->string('route_type')->toString() ?: null;
        $schoolFilter = $schoolScopeId ?: ($request->string('school_id')->toString() ?: null);

        $now = Carbon::now();
        $fleet = [];

        foreach ($vehicles as $index => $vehicle) {
            $driver = $vehicle->assignedDriver;
            $snapshot = GpsSnapshot::where('vehicle_id', $vehicle->id)->latest('recorded_at')->first();
            $position = $snapshot
                ? [
                    'latitude' => (float) $snapshot->latitude,
                    'longitude' => (float) $snapshot->longitude,
                    'heading' => (float) ($snapshot->heading ?? 0),
                    'speed_mph' => (float) ($snapshot->speed_mph ?? 0),
                    'recorded_at' => $snapshot->recorded_at?->toIso8601String(),
                ]
                : $this->simulatedPosition($vehicle->id, $index, $now);

            if ($request->string('movement')->toString() === 'moving' && $position['speed_mph'] < 1) {
                continue;
            }
            if ($request->string('movement')->toString() === 'idle' && $position['speed_mph'] >= 1) {
                continue;
            }

            $routeContext = $this->resolveRouteContext(
                $vehicle,
                $driver,
                $index,
                $allRoutes,
                $routesBySchool,
                $runsByRoute,
                $todayAssignments,
            );

            if ($routeTypeFilter && ($routeContext['type'] ?? null) !== $routeTypeFilter) {
                continue;
            }
            if ($schoolFilter && ($routeContext['school_id'] ?? null) !== $schoolFilter) {
                continue;
            }

            if ($schoolScopeId && ($routeContext['school_id'] ?? null) !== $schoolScopeId) {
                continue;
            }

            if ($isContractor && ! in_array($routeContext['id'] ?? null, $contractorRouteIds, true)) {
                continue;
            }

            $fleet[] = [
                'id' => $vehicle->id,
                'vehicle_number' => $vehicle->vehicle_number,
                'type' => $vehicle->type,
                'status' => $vehicle->status,
                'license_plate' => $vehicle->license_plate,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'capacity' => $vehicle->capacity,
                'latitude' => $position['latitude'],
                'longitude' => $position['longitude'],
                'heading' => $position['heading'],
                'speed_mph' => $position['speed_mph'],
                'recorded_at' => $position['recorded_at'],
                'is_simulated' => ! $snapshot,
                'route' => $routeContext,
                'driver' => $driver ? [
                    'id' => $driver->id,
                    'first_name' => $driver->first_name,
                    'last_name' => $driver->last_name,
                    'employee_id' => $driver->employee_id,
                    'phone' => $driver->phone,
                    'email' => $driver->email,
                    'status' => $driver->status,
                    'license_number' => $driver->license_number,
                    'license_class' => $driver->license_class,
                    'students_count' => (int) ($driverStudentCounts[$driver->id] ?? 0),
                ] : null,
            ];
        }

        return response()->json([
            'data' => [
                'updated_at' => $now->toIso8601String(),
                'center' => $this->fleetCenter($fleet),
                'vehicles' => $fleet,
            ],
        ]);
    }

    /**
     * @param  Collection<int, Route>  $allRoutes
     * @param  Collection<string, Collection<int, Route>>  $routesBySchool
     * @param  Collection<string, Collection<int, Run>>  $runsByRoute
     * @param  Collection<int, RunAssignment>  $todayAssignments
     * @return array<string, mixed>|null
     */
    private function resolveRouteContext(
        Vehicle $vehicle,
        ?Driver $driver,
        int $index,
        Collection $allRoutes,
        Collection $routesBySchool,
        Collection $runsByRoute,
        Collection $todayAssignments,
    ): ?array {
        $assignment = $todayAssignments->first(function (RunAssignment $a) use ($vehicle, $driver) {
            if ($a->vehicle_id === $vehicle->id) {
                return true;
            }

            return $driver && $a->driver_id === $driver->id;
        });

        $route = null;
        $run = null;
        $assignmentStatus = null;

        if ($assignment?->run) {
            $run = $assignment->run;
            $route = $run->route;
            $assignmentStatus = $assignment->status;
        }

        if (! $route && $driver) {
            $schoolId = Student::where('assigned_driver_id', $driver->id)->value('school_id');
            if ($schoolId && $routesBySchool->has($schoolId)) {
                $route = $routesBySchool->get($schoolId)?->get($index % max($routesBySchool->get($schoolId)->count(), 1));
            }
        }

        if (! $route && $allRoutes->isNotEmpty()) {
            $route = $allRoutes->get($index % $allRoutes->count());
        }

        if (! $route) {
            return null;
        }

        if (! $run) {
            $run = $runsByRoute->get($route->id)?->first();
        }

        return [
            'id' => $route->id,
            'name' => $route->name,
            'code' => $route->code,
            'type' => $route->type,
            'status' => $route->status,
            'school_id' => $route->school_id,
            'school_name' => $route->school?->name,
            'school_code' => $route->school?->code,
            'run' => $run ? [
                'id' => $run->id,
                'name' => $run->name,
                'scheduled_start' => $run->scheduled_start_time,
                'scheduled_end' => $run->scheduled_end_time,
                'direction' => $run->direction,
                'estimated_miles' => $run->estimated_distance_miles,
                'status' => $run->status,
            ] : null,
            'assignment_status' => $assignmentStatus,
        ];
    }

    /**
     * @return array{latitude: float, longitude: float, heading: float, speed_mph: float, recorded_at: string}
     */
    private function simulatedPosition(string $vehicleId, int $index, Carbon $now): array
    {
        $seed = crc32($vehicleId);
        $baseLat = 39.7817 + (($seed % 1000) / 100000) + ($index * 0.008);
        $baseLng = -89.6501 + ((($seed >> 8) % 1000) / 100000) - ($index * 0.006);
        $t = $now->timestamp / 20;
        $phase = ($seed % 360) * (M_PI / 180);

        return [
            'latitude' => round($baseLat + sin($t + $phase) * 0.015, 6),
            'longitude' => round($baseLng + cos($t + $phase) * 0.018, 6),
            'heading' => round(fmod(($t * 25 + $seed) * 180 / M_PI, 360), 1),
            'speed_mph' => round(12 + (abs(sin($t + $phase)) * 28), 1),
            'recorded_at' => $now->toIso8601String(),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $fleet
     * @return array{lat: float, lng: float}
     */
    private function fleetCenter(array $fleet): array
    {
        if ($fleet === []) {
            return ['lat' => 39.7817, 'lng' => -89.6501];
        }

        $lat = array_sum(array_column($fleet, 'latitude')) / count($fleet);
        $lng = array_sum(array_column($fleet, 'longitude')) / count($fleet);

        return ['lat' => round($lat, 6), 'lng' => round($lng, 6)];
    }
}
