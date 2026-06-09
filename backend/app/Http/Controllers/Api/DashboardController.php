<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Organization;
use App\Models\Route;
use App\Models\Run;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /** @var array<int, string> */
    private const CHART_FILLS = ['#4F5BA9', '#0EA5E9', '#06B6D4', '#F97316', '#8B5CF6', '#6B76C2', '#38BDF8', '#FB923C', '#10B981', '#14B8A6', '#EC4899', '#F59E0B'];

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'super_admin') {
            return response()->json([
                'data' => [
                    'organizations' => ['total' => Organization::count()],
                    'users' => ['total' => User::where('role', '!=', 'super_admin')->count()],
                    'admins' => ['total' => User::where('role', 'admin')->count()],
                ],
            ]);
        }

        $orgId = $user->organization_id;
        [$from, $to] = $this->resolveDateRange($request);

        $licenseExpiring = Driver::forOrganization($orgId)
            ->whereNotNull('license_expiry')
            ->whereBetween('license_expiry', [Carbon::now(), Carbon::now()->addDays(30)])
            ->count();

        $vehiclesMaintenance = Vehicle::forOrganization($orgId)
            ->whereIn('status', ['maintenance', 'out_of_service'])
            ->count();

        return response()->json([
            'data' => [
                'students' => [
                    'total' => $this->scoped(Student::forOrganization($orgId), $from, $to)->count(),
                    'active' => $this->scoped(Student::forOrganization($orgId), $from, $to)->where('status', 'active')->count(),
                ],
                'drivers' => [
                    'total' => $this->scoped(Driver::forOrganization($orgId), $from, $to)->count(),
                    'active' => $this->scoped(Driver::forOrganization($orgId), $from, $to)->where('status', 'active')->count(),
                ],
                'vehicles' => [
                    'total' => $this->scoped(Vehicle::forOrganization($orgId), $from, $to)->count(),
                    'active' => $this->scoped(Vehicle::forOrganization($orgId), $from, $to)->where('status', 'active')->count(),
                ],
                'schools' => [
                    'total' => $this->scoped(School::forOrganization($orgId), $from, $to)->count(),
                ],
                'routes' => [
                    'total' => $this->scopedRoute(Route::forOrganization($orgId), $request, $from, $to)->count(),
                    'active' => $this->scopedRoute(Route::forOrganization($orgId), $request, $from, $to)->where('status', 'active')->count(),
                ],
                'runs' => [
                    'total' => Run::whereHas('route', fn ($q) => $q->where('organization_id', $orgId))
                        ->when($from && $to, fn ($q) => $q->whereBetween('created_at', [$from, $to]))
                        ->count(),
                ],
                'users' => [
                    'total' => User::where('organization_id', $orgId)->where('is_active', true)->count(),
                ],
                'alerts' => [
                    'licenses_expiring' => $licenseExpiring,
                    'vehicles_maintenance' => $vehiclesMaintenance,
                ],
            ],
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'super_admin') {
            return response()->json(['data' => ['items' => [], 'total' => 0]]);
        }

        $orgId = $user->organization_id;
        $items = [];

        $licenseExpiring = Driver::forOrganization($orgId)
            ->whereNotNull('license_expiry')
            ->whereBetween('license_expiry', [Carbon::now(), Carbon::now()->addDays(30)])
            ->orderBy('license_expiry');

        $licenseCount = (clone $licenseExpiring)->count();
        if ($licenseCount > 0) {
            $names = (clone $licenseExpiring)
                ->limit(3)
                ->get(['first_name', 'last_name'])
                ->map(fn ($d) => trim("{$d->first_name} {$d->last_name}"))
                ->implode(', ');

            $items[] = [
                'id' => 'licenses_expiring',
                'category' => 'compliance',
                'severity' => 'warning',
                'title' => 'Driver licenses expiring soon',
                'message' => $licenseCount === 1
                    ? '1 driver license expires within 30 days.'
                    : "{$licenseCount} driver licenses expire within 30 days.",
                'detail' => $names.($licenseCount > 3 ? '…' : ''),
                'count' => $licenseCount,
                'href' => '/dashboard/drivers',
                'action_label' => 'Review drivers',
            ];
        }

        $vehiclesMaintenance = Vehicle::forOrganization($orgId)
            ->whereIn('status', ['maintenance', 'out_of_service']);

        $maintenanceCount = (clone $vehiclesMaintenance)->count();
        if ($maintenanceCount > 0) {
            $units = (clone $vehiclesMaintenance)
                ->orderBy('vehicle_number')
                ->limit(3)
                ->pluck('vehicle_number')
                ->implode(', ');

            $items[] = [
                'id' => 'vehicles_maintenance',
                'category' => 'fleet',
                'severity' => 'danger',
                'title' => 'Vehicles need attention',
                'message' => $maintenanceCount === 1
                    ? '1 vehicle is in maintenance or out of service.'
                    : "{$maintenanceCount} vehicles are in maintenance or out of service.",
                'detail' => $units.($maintenanceCount > 3 ? '…' : ''),
                'count' => $maintenanceCount,
                'href' => '/dashboard/vehicles',
                'action_label' => 'View fleet',
            ];
        }

        $unassignedStudents = Student::forOrganization($orgId)
            ->where('status', 'active')
            ->whereNull('assigned_driver_id')
            ->count();

        if ($unassignedStudents > 0) {
            $items[] = [
                'id' => 'students_unassigned',
                'category' => 'operations',
                'severity' => 'info',
                'title' => 'Students without a driver',
                'message' => $unassignedStudents === 1
                    ? '1 active student has no assigned driver.'
                    : "{$unassignedStudents} active students have no assigned driver.",
                'detail' => 'Assign drivers to ensure route coverage.',
                'count' => $unassignedStudents,
                'href' => '/dashboard/students?assignment=unassigned',
                'action_label' => 'Assign students',
            ];
        }

        $driversWithoutVehicle = Driver::forOrganization($orgId)
            ->where('status', 'active')
            ->whereNull('default_vehicle_id')
            ->count();

        if ($driversWithoutVehicle > 0) {
            $items[] = [
                'id' => 'drivers_unassigned_vehicle',
                'category' => 'fleet',
                'severity' => 'info',
                'title' => 'Drivers without a vehicle',
                'message' => $driversWithoutVehicle === 1
                    ? '1 active driver has no default vehicle.'
                    : "{$driversWithoutVehicle} active drivers have no default vehicle.",
                'detail' => 'Link drivers to fleet units for dispatch readiness.',
                'count' => $driversWithoutVehicle,
                'href' => '/dashboard/drivers?vehicle_assignment=unassigned',
                'action_label' => 'Assign vehicles',
            ];
        }

        $draftRoutes = Route::forOrganization($orgId)->where('status', 'draft')->count();
        if ($draftRoutes > 0) {
            $items[] = [
                'id' => 'routes_draft',
                'category' => 'operations',
                'severity' => 'warning',
                'title' => 'Draft routes pending',
                'message' => $draftRoutes === 1
                    ? '1 route is still in draft status.'
                    : "{$draftRoutes} routes are still in draft status.",
                'detail' => 'Activate routes before scheduling runs.',
                'count' => $draftRoutes,
                'href' => '/dashboard/routes?status=draft',
                'action_label' => 'Review routes',
            ];
        }

        return response()->json([
            'data' => [
                'items' => $items,
                'total' => count($items),
            ],
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'super_admin') {
            return response()->json(['data' => [
                'fleet_overview' => [],
                'operations_radar' => [],
                'routes_by_type' => [],
                'vehicles_by_type' => [],
                'students_by_school' => [],
                'vehicle_status' => [],
                'driver_status' => [],
                'student_status' => [],
            ]]);
        }

        $orgId = $user->organization_id;
        [$from, $to] = $this->resolveDateRange($request);
        $schoolId = $request->string('school_id')->toString() ?: null;
        $routeType = $request->string('route_type')->toString() ?: null;

        $students = $this->scoped(Student::forOrganization($orgId), $from, $to)
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId));
        $drivers = $this->scoped(Driver::forOrganization($orgId), $from, $to);
        $vehicles = $this->scoped(Vehicle::forOrganization($orgId), $from, $to);
        $routes = $this->scopedRoute(Route::forOrganization($orgId), $request, $from, $to);
        $schools = $this->scoped(School::forOrganization($orgId), $from, $to);

        $studentTotal = (clone $students)->count();
        $studentActive = (clone $students)->where('status', 'active')->count();
        $driverTotal = (clone $drivers)->count();
        $driverActive = (clone $drivers)->where('status', 'active')->count();
        $vehicleTotal = (clone $vehicles)->count();
        $vehicleActive = (clone $vehicles)->where('status', 'active')->count();
        $routeTotal = (clone $routes)->count();
        $routeActive = (clone $routes)->where('status', 'active')->count();
        $schoolTotal = (clone $schools)->count();
        $schoolsWithStudents = (clone $schools)->has('students')->count();
        $runTotal = Run::whereHas('route', fn ($q) => $q->where('organization_id', $orgId))
            ->when($from && $to, fn ($q) => $q->whereBetween('created_at', [$from, $to]))
            ->when($routeType, fn ($q) => $q->whereHas('route', fn ($r) => $r->where('type', $routeType)))
            ->when($schoolId, fn ($q) => $q->whereHas('route', fn ($r) => $r->where('school_id', $schoolId)))
            ->count();

        $fleetOverview = [
            ['name' => 'Students', 'value' => $studentTotal, 'fill' => '#4F5BA9'],
            ['name' => 'Drivers', 'value' => $driverTotal, 'fill' => '#06B6D4'],
            ['name' => 'Vehicles', 'value' => $vehicleTotal, 'fill' => '#0EA5E9'],
            ['name' => 'Routes', 'value' => $routeTotal, 'fill' => '#F97316'],
            ['name' => 'Schools', 'value' => $schoolTotal, 'fill' => '#6B76C2'],
            ['name' => 'Runs', 'value' => $runTotal, 'fill' => '#10B981'],
        ];

        $studentsAssigned = (clone $students)->whereNotNull('assigned_driver_id')->count();
        $driversWithVehicle = (clone $drivers)->whereNotNull('default_vehicle_id')->count();
        $licenseValid = (clone $drivers)
            ->where(function ($q) {
                $q->whereNull('license_expiry')
                    ->orWhere('license_expiry', '>=', Carbon::now()->toDateString());
            })
            ->count();

        $operationsRadar = [
            ['subject' => 'Students', 'score' => $this->pct($studentActive, $studentTotal), 'fullMark' => 100],
            ['subject' => 'Drivers', 'score' => $this->pct($driverActive, $driverTotal), 'fullMark' => 100],
            ['subject' => 'Vehicles', 'score' => $this->pct($vehicleActive, $vehicleTotal), 'fullMark' => 100],
            ['subject' => 'Routes', 'score' => $this->pct($routeActive, $routeTotal), 'fullMark' => 100],
            ['subject' => 'Schools', 'score' => $this->pct($schoolsWithStudents, max($schoolTotal, 1)), 'fullMark' => 100],
            ['subject' => 'Runs', 'score' => min(100, $routeTotal > 0 ? (int) round(($runTotal / max($routeTotal, 1)) * 50) : 0), 'fullMark' => 100],
            ['subject' => 'Assignments', 'score' => $this->pct($studentsAssigned, max($studentTotal, 1)), 'fullMark' => 100],
            ['subject' => 'Utilization', 'score' => $this->pct($driversWithVehicle, max($driverTotal, 1)), 'fullMark' => 100],
            ['subject' => 'Compliance', 'score' => $this->pct($licenseValid, max($driverTotal, 1)), 'fullMark' => 100],
        ];

        $routeQuery = clone $routes;
        $vehicleQuery = clone $vehicles;
        $driverQuery = clone $drivers;
        $studentQuery = clone $students;

        return response()->json([
            'data' => [
                'fleet_overview' => $fleetOverview,
                'operations_radar' => $operationsRadar,
                'routes_by_type' => $this->routesByTypeChart(clone $routeQuery),
                'vehicles_by_type' => $this->groupedChart(
                    (clone $vehicleQuery)->selectRaw('type as label, COUNT(*) as total')->groupBy('type')->get(),
                    fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                    2,
                ),
                'students_by_school' => (clone $schools)
                    ->when($schoolId, fn ($q) => $q->where('id', $schoolId))
                    ->withCount(['students' => fn ($q) => $this->applyDateScope($q, $from, $to)])
                    ->orderByDesc('students_count')
                    ->limit(8)
                    ->get()
                    ->values()
                    ->map(fn ($s, $i) => [
                        'name' => $s->name,
                        'value' => $s->students_count,
                        'fill' => self::CHART_FILLS[$i % count(self::CHART_FILLS)],
                    ]),
                'vehicle_status' => $this->groupedChart(
                    (clone $vehicleQuery)->selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
                    fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                    1,
                ),
                'driver_status' => $this->groupedChart(
                    (clone $driverQuery)->selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
                    fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                    3,
                ),
                'student_status' => $this->groupedChart(
                    (clone $studentQuery)->selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
                    fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                    0,
                ),
            ],
        ]);
    }

    /**
     * @return array{0: ?Carbon, 1: ?Carbon}
     */
    private function resolveDateRange(Request $request): array
    {
        $period = $request->string('period', 'all')->toString();

        if ($period === 'all' || $period === '') {
            return [null, null];
        }

        if ($period === 'custom') {
            $from = $request->date('from')?->startOfDay();
            $to = $request->date('to')?->endOfDay() ?? now()->endOfDay();

            return [$from, $to];
        }

        $to = now()->endOfDay();

        $from = match ($period) {
            '7d' => now()->subDays(7)->startOfDay(),
            '30d' => now()->subDays(30)->startOfDay(),
            '90d' => now()->subDays(90)->startOfDay(),
            'ytd' => now()->startOfYear()->startOfDay(),
            default => null,
        };

        return [$from, $to];
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    private function scoped(Builder $query, ?Carbon $from, ?Carbon $to): Builder
    {
        return $this->applyDateScope($query, $from, $to);
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    private function scopedRoute(Builder $query, Request $request, ?Carbon $from, ?Carbon $to): Builder
    {
        $routeType = $request->string('route_type')->toString() ?: null;
        $schoolId = $request->string('school_id')->toString() ?: null;

        return $this->applyDateScope($query, $from, $to)
            ->when($routeType, fn ($q) => $q->where('type', $routeType))
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId));
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    private function applyDateScope(Builder $query, ?Carbon $from, ?Carbon $to): Builder
    {
        if ($from && $to) {
            $query->whereBetween('created_at', [$from, $to]);
        }

        return $query;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, object{label: string, total: int|string}>  $rows
     * @return array<int, array{name: string, value: int, fill: string}>
     */
    private function groupedChart($rows, callable $labelFn, int $colorOffset = 0): array
    {
        return $rows->values()->map(fn ($row, $i) => [
            'name' => $labelFn($row->label),
            'value' => (int) $row->total,
            'fill' => self::CHART_FILLS[($i + $colorOffset) % count(self::CHART_FILLS)],
        ])->all();
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return array<int, array{name: string, value: int, active: int, fill: string}>
     */
    private function routesByTypeChart(Builder $query): array
    {
        $labels = [
            'am' => 'Morning (AM)',
            'pm' => 'Afternoon (PM)',
            'midday' => 'Midday',
            'special' => 'Special',
        ];

        $rows = $query
            ->selectRaw("type as label, COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active")
            ->groupBy('type')
            ->orderByDesc('total')
            ->get();

        return $rows->values()->map(function ($row, $i) use ($labels) {
            $key = strtolower((string) $row->label);

            return [
                'name' => $labels[$key] ?? strtoupper($key),
                'value' => (int) $row->total,
                'active' => (int) $row->active,
                'fill' => self::CHART_FILLS[$i % count(self::CHART_FILLS)],
            ];
        })->all();
    }

    private function pct(int $part, int $whole): int
    {
        if ($whole <= 0) {
            return 0;
        }

        return (int) round(($part / $whole) * 100);
    }
}
