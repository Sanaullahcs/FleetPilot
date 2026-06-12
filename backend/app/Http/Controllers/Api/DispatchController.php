<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Models\Driver;
use App\Models\Route;
use App\Models\Run;
use App\Models\RunAssignment;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class DispatchController extends Controller
{
    use ResolvesAccessScope;

    public function runsToday(Request $request): JsonResponse
    {
        $this->assertOpsRole($request);
        $orgId = $request->user()->organization_id;
        $schoolId = $this->schoolScopeId($request->user());
        $date = Carbon::parse($request->string('date')->toString() ?: today())->startOfDay();
        $dayOfWeek = $date->dayOfWeekIso;

        $runs = Run::query()
            ->where('status', 'active')
            ->whereHas('route', function ($q) use ($orgId, $schoolId) {
                $q->where('organization_id', $orgId)->where('status', 'active');
                if ($schoolId) {
                    $q->where('school_id', $schoolId);
                }
            })
            ->with([
                'route:id,name,code,type,school_id,days_of_week',
                'route.school:id,name,code',
                'assignments' => fn ($q) => $q
                    ->whereDate('service_date', $date)
                    ->with([
                        'driver:id,first_name,last_name,employee_id,status',
                        'vehicle:id,vehicle_number,type,status',
                    ]),
            ])
            ->orderBy('scheduled_start_time')
            ->get()
            ->filter(function (Run $run) use ($dayOfWeek, $date) {
                $hasAssignmentForDate = $run->assignments->contains(
                    fn ($a) => $a->status !== 'cancelled'
                        && Carbon::parse($a->service_date)->isSameDay($date),
                );
                if ($hasAssignmentForDate) {
                    return true;
                }

                $days = $run->route?->days_of_week;
                if (empty($days) || ! is_array($days)) {
                    return true;
                }

                return in_array($dayOfWeek, $days, true);
            })
            ->values();

        $items = $runs->map(fn (Run $run) => $this->formatRunRow($run))->all();
        $summarySource = $items;
        $items = $this->filterDispatchItems($items, $request);

        $assigned = collect($summarySource)->filter(fn ($row) => $row['assignment'] !== null)->count();
        $inProgress = collect($summarySource)->filter(fn ($row) => ($row['assignment']['status'] ?? null) === 'in_progress')->count();

        return response()->json([
            'data' => [
                'date' => $date->toDateString(),
                'summary' => [
                    'total' => count($summarySource),
                    'assigned' => $assigned,
                    'unassigned' => count($summarySource) - $assigned,
                    'in_progress' => $inProgress,
                ],
                'runs' => array_values($items),
                'filtered_total' => count($items),
            ],
        ]);
    }

    public function storeRun(Request $request): JsonResponse
    {
        $this->assertOpsRole($request);
        $orgId = $request->user()->organization_id;
        $schoolId = $this->schoolScopeId($request->user());

        $data = $request->validate([
            'route_id' => ['required', 'uuid', 'exists:routes,id'],
            'name' => ['required', 'string', 'max:255'],
            'scheduled_start_time' => ['required', 'string', 'max:8'],
            'scheduled_end_time' => ['nullable', 'string', 'max:8'],
            'direction' => ['required', 'in:to_school,from_school,other'],
            'estimated_distance_miles' => ['nullable', 'numeric', 'min:0'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:1'],
            'service_date' => ['required', 'date'],
            'driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
            'vehicle_id' => ['nullable', 'uuid', 'exists:vehicles,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if (! empty($data['driver_id']) xor ! empty($data['vehicle_id'])) {
            throw ValidationException::withMessages([
                'driver_id' => 'Select both a driver and a vehicle to dispatch immediately, or leave both empty.',
            ]);
        }

        $route = Route::forOrganization($orgId)->find($data['route_id']);
        if (! $route) {
            throw ValidationException::withMessages(['route_id' => 'Route not found in your organization.']);
        }
        if ($route->status !== 'active') {
            throw ValidationException::withMessages(['route_id' => 'Route must be active before scheduling a run.']);
        }
        if ($schoolId && $route->school_id !== $schoolId) {
            abort(403, 'You can only create runs for your school.');
        }

        $serviceDate = Carbon::parse($data['service_date'])->startOfDay();
        $startTime = $this->normalizeTime($data['scheduled_start_time']);
        $endTime = isset($data['scheduled_end_time']) ? $this->normalizeTime($data['scheduled_end_time']) : null;

        if ($endTime && $this->timeToMinutes($endTime) <= $this->timeToMinutes($startTime)) {
            throw ValidationException::withMessages([
                'scheduled_end_time' => 'End time must be after start time.',
            ]);
        }

        $this->ensureRouteRunsOnDate($route, $serviceDate);

        $run = Run::create([
            'route_id' => $route->id,
            'name' => $data['name'],
            'scheduled_start_time' => $startTime,
            'scheduled_end_time' => $endTime,
            'direction' => $data['direction'],
            'estimated_distance_miles' => $data['estimated_distance_miles'] ?? null,
            'estimated_duration_minutes' => $data['estimated_duration_minutes'] ?? null,
            'status' => 'active',
            'effective_date' => $serviceDate->toDateString(),
            'created_by' => $request->user()->id,
        ]);

        if (! empty($data['driver_id']) && ! empty($data['vehicle_id'])) {
            $driver = $this->assertEligibleDriver($orgId, $data['driver_id']);
            $vehicle = $this->assertActiveVehicle($orgId, $data['vehicle_id']);
            $this->assertNoConflict($serviceDate, $driver->id, $vehicle->id, $run);

            RunAssignment::create([
                'run_id' => $run->id,
                'service_date' => $serviceDate->toDateString(),
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'status' => 'scheduled',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);
        }

        $run->load([
            'route:id,name,code,type,school_id,days_of_week',
            'route.school:id,name,code',
            'assignments' => fn ($q) => $q
                ->whereDate('service_date', $serviceDate)
                ->with([
                    'driver:id,first_name,last_name,employee_id,status',
                    'vehicle:id,vehicle_number,type,status',
                ]),
        ]);

        return response()->json([
            'data' => $this->formatRunRow($run),
            'message' => ! empty($data['driver_id'])
                ? 'Run created and dispatched.'
                : 'Run created. Assign a driver and vehicle when ready.',
        ], 201);
    }

    public function assign(Request $request, Run $run): JsonResponse
    {
        $this->assertOpsRole($request);
        $this->authorizeRun($request, $run);

        $data = $request->validate([
            'service_date' => ['required', 'date'],
            'driver_id' => ['required', 'uuid', 'exists:drivers,id'],
            'vehicle_id' => ['required', 'uuid', 'exists:vehicles,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $orgId = $request->user()->organization_id;
        $serviceDate = Carbon::parse($data['service_date'])->startOfDay();

        $driver = $this->assertEligibleDriver($orgId, $data['driver_id']);
        $vehicle = $this->assertActiveVehicle($orgId, $data['vehicle_id']);

        $existing = RunAssignment::where('run_id', $run->id)
            ->whereDate('service_date', $serviceDate)
            ->first();

        $this->assertNoConflict(
            $serviceDate,
            $data['driver_id'],
            $data['vehicle_id'],
            $run,
            $existing?->id,
        );

        $assignment = RunAssignment::updateOrCreate(
            [
                'run_id' => $run->id,
                'service_date' => $serviceDate->toDateString(),
            ],
            [
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'status' => in_array($existing?->status, ['in_progress', 'completed'], true)
                    ? $existing->status
                    : 'scheduled',
                'notes' => $data['notes'] ?? $existing?->notes,
                'created_by' => $existing?->created_by ?? $request->user()->id,
            ],
        );

        $assignment->load([
            'driver:id,first_name,last_name,employee_id,status',
            'vehicle:id,vehicle_number,type,status',
        ]);

        $run->load([
            'route:id,name,code,type,school_id,days_of_week',
            'route.school:id,name,code',
            'assignments' => fn ($q) => $q
                ->whereDate('service_date', $serviceDate)
                ->with([
                    'driver:id,first_name,last_name,employee_id,status',
                    'vehicle:id,vehicle_number,type,status',
                ]),
        ]);

        return response()->json([
            'data' => [
                'assignment' => $this->formatAssignment($assignment),
                'run' => $this->formatRunRow($run),
            ],
            'message' => 'Run assigned successfully.',
        ]);
    }

    public function updateAssignment(Request $request, RunAssignment $assignment): JsonResponse
    {
        $this->assertOpsRole($request);
        $assignment->load('run.route');
        $orgId = $request->user()->organization_id;

        if ($assignment->run?->route?->organization_id !== $orgId) {
            abort(404);
        }

        $schoolId = $this->schoolScopeId($request->user());
        if ($schoolId && $assignment->run?->route?->school_id !== $schoolId) {
            abort(403, 'You can only update assignments for your school.');
        }

        if ($assignment->status === 'completed') {
            throw ValidationException::withMessages([
                'assignment' => 'Completed assignments cannot be changed.',
            ]);
        }

        $data = $request->validate([
            'driver_id' => ['required', 'uuid', 'exists:drivers,id'],
            'vehicle_id' => ['required', 'uuid', 'exists:vehicles,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $serviceDate = Carbon::parse($assignment->service_date)->startOfDay();
        $driver = $this->assertEligibleDriver($orgId, $data['driver_id']);
        $vehicle = $this->assertActiveVehicle($orgId, $data['vehicle_id']);

        $this->assertNoConflict(
            $serviceDate,
            $data['driver_id'],
            $data['vehicle_id'],
            $assignment->run,
            $assignment->id,
        );

        $assignment->update([
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'notes' => $data['notes'] ?? $assignment->notes,
            'status' => $assignment->status === 'cancelled' ? 'scheduled' : $assignment->status,
        ]);

        $assignment->load([
            'driver:id,first_name,last_name,employee_id,status',
            'vehicle:id,vehicle_number,type,status',
        ]);

        return response()->json([
            'data' => $this->formatAssignment($assignment),
            'message' => 'Assignment updated.',
        ]);
    }

    public function cancelAssignment(Request $request, RunAssignment $assignment): JsonResponse
    {
        $this->assertOpsRole($request);
        $assignment->load('run.route');
        $orgId = $request->user()->organization_id;

        if ($assignment->run?->route?->organization_id !== $orgId) {
            abort(404);
        }

        $schoolId = $this->schoolScopeId($request->user());
        if ($schoolId && $assignment->run?->route?->school_id !== $schoolId) {
            abort(403, 'You can only cancel assignments for your school.');
        }

        if ($assignment->status === 'in_progress') {
            throw ValidationException::withMessages([
                'assignment' => 'Cannot cancel a run that is already in progress.',
            ]);
        }

        $assignment->update(['status' => 'cancelled']);

        return response()->json([
            'data' => $this->formatAssignment($assignment->fresh([
                'driver:id,first_name,last_name,employee_id,status',
                'vehicle:id,vehicle_number,type,status',
            ])),
            'message' => 'Assignment cancelled.',
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function filterDispatchItems(array $items, Request $request): array
    {
        $search = strtolower(trim($request->string('search')->toString()));
        if ($search !== '') {
            $items = array_values(array_filter($items, function (array $row) use ($search) {
                $haystack = strtolower(implode(' ', array_filter([
                    $row['name'] ?? '',
                    $row['route']['name'] ?? '',
                    $row['route']['code'] ?? '',
                    $row['route']['school']['name'] ?? '',
                    $row['route']['school']['code'] ?? '',
                    $row['assignment']['driver']['first_name'] ?? '',
                    $row['assignment']['driver']['last_name'] ?? '',
                    $row['assignment']['driver']['employee_id'] ?? '',
                    $row['assignment']['vehicle']['vehicle_number'] ?? '',
                ])));

                return str_contains($haystack, $search);
            }));
        }

        $assignment = $request->string('assignment')->toString();
        if ($assignment === 'unassigned') {
            $items = array_values(array_filter($items, fn (array $row) => $row['assignment'] === null));
        } elseif ($assignment === 'assigned') {
            $items = array_values(array_filter($items, fn (array $row) => $row['assignment'] !== null));
        }

        $status = $request->string('status')->toString();
        if ($status === 'in_progress') {
            $items = array_values(array_filter($items, fn (array $row) => ($row['assignment']['status'] ?? null) === 'in_progress'));
        } elseif ($status !== '') {
            $items = array_values(array_filter($items, fn (array $row) => ($row['assignment']['status'] ?? null) === $status));
        }

        $routeType = $request->string('route_type')->toString();
        if ($routeType !== '') {
            $items = array_values(array_filter($items, fn (array $row) => ($row['route']['type'] ?? null) === $routeType));
        }

        $schoolId = $request->string('school_id')->toString();
        if ($schoolId !== '') {
            $items = array_values(array_filter($items, fn (array $row) => ($row['route']['school']['id'] ?? null) === $schoolId));
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatRunRow(Run $run): array
    {
        $assignment = $run->assignments->first();
        $activeAssignment = $assignment && $assignment->status !== 'cancelled' ? $assignment : null;

        return [
            'id' => $run->id,
            'name' => $run->name,
            'scheduled_start_time' => $run->scheduled_start_time,
            'scheduled_end_time' => $run->scheduled_end_time,
            'direction' => $run->direction,
            'estimated_distance_miles' => $run->estimated_distance_miles,
            'status' => $run->status,
            'route' => $run->route ? [
                'id' => $run->route->id,
                'name' => $run->route->name,
                'code' => $run->route->code,
                'type' => $run->route->type,
                'school' => $run->route->school ? [
                    'id' => $run->route->school->id,
                    'name' => $run->route->school->name,
                    'code' => $run->route->school->code,
                ] : null,
            ] : null,
            'assignment' => $activeAssignment ? $this->formatAssignment($activeAssignment) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAssignment(RunAssignment $assignment): array
    {
        return [
            'id' => $assignment->id,
            'service_date' => $assignment->service_date?->toDateString(),
            'status' => $assignment->status,
            'notes' => $assignment->notes,
            'driver' => $assignment->driver ? [
                'id' => $assignment->driver->id,
                'first_name' => $assignment->driver->first_name,
                'last_name' => $assignment->driver->last_name,
                'employee_id' => $assignment->driver->employee_id,
                'status' => $assignment->driver->status,
            ] : null,
            'vehicle' => $assignment->vehicle ? [
                'id' => $assignment->vehicle->id,
                'vehicle_number' => $assignment->vehicle->vehicle_number,
                'type' => $assignment->vehicle->type,
                'status' => $assignment->vehicle->status,
            ] : null,
        ];
    }

    private function authorizeRun(Request $request, Run $run): void
    {
        $run->loadMissing('route');
        if ($run->route?->organization_id !== $request->user()->organization_id) {
            abort(404);
        }

        $schoolId = $this->schoolScopeId($request->user());
        if ($schoolId && $run->route?->school_id !== $schoolId) {
            abort(403, 'You can only manage runs for your school.');
        }
    }

    private function assertEligibleDriver(string $orgId, string $driverId): Driver
    {
        $driver = Driver::forOrganization($orgId)
            ->with('user:id,is_active,role')
            ->find($driverId);

        if (! $driver) {
            throw ValidationException::withMessages(['driver_id' => 'Driver not found in your organization.']);
        }

        if ($driver->status !== 'active') {
            throw ValidationException::withMessages(['driver_id' => 'Driver must have active employment status.']);
        }

        if (! $driver->user || ! $driver->user->is_active) {
            throw ValidationException::withMessages(['driver_id' => 'Driver account must be approved and active.']);
        }

        if ($driver->user->role !== 'driver') {
            throw ValidationException::withMessages(['driver_id' => 'Selected user is not a driver account.']);
        }

        if ($driver->license_expiry && $driver->license_expiry->isPast()) {
            throw ValidationException::withMessages(['driver_id' => 'Driver license is expired.']);
        }

        return $driver;
    }

    private function assertActiveVehicle(string $orgId, string $vehicleId): Vehicle
    {
        $vehicle = Vehicle::forOrganization($orgId)->find($vehicleId);

        if (! $vehicle) {
            throw ValidationException::withMessages(['vehicle_id' => 'Vehicle not found in your organization.']);
        }

        if ($vehicle->status !== 'active') {
            throw ValidationException::withMessages(['vehicle_id' => 'Vehicle must be active.']);
        }

        return $vehicle;
    }

    private function assertNoConflict(
        Carbon $serviceDate,
        string $driverId,
        string $vehicleId,
        Run $run,
        ?string $excludeAssignmentId = null,
    ): void {
        $start = $this->timeToMinutes($run->scheduled_start_time);
        $end = $this->timeToMinutes($run->scheduled_end_time ?? $run->scheduled_start_time);

        $others = RunAssignment::query()
            ->whereDate('service_date', $serviceDate)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->when($excludeAssignmentId, fn ($q) => $q->where('id', '!=', $excludeAssignmentId))
            ->where(function ($q) use ($driverId, $vehicleId) {
                $q->where('driver_id', $driverId)->orWhere('vehicle_id', $vehicleId);
            })
            ->where('run_id', '!=', $run->id)
            ->with('run:id,scheduled_start_time,scheduled_end_time,name')
            ->get();

        foreach ($others as $other) {
            if (! $other->run) {
                continue;
            }

            $otherStart = $this->timeToMinutes($other->run->scheduled_start_time);
            $otherEnd = $this->timeToMinutes($other->run->scheduled_end_time ?? $other->run->scheduled_start_time);

            if (! $this->timesOverlap($start, $end, $otherStart, $otherEnd)) {
                continue;
            }

            if ($other->driver_id === $driverId) {
                throw ValidationException::withMessages([
                    'driver_id' => "Driver is already assigned to {$other->run->name} during this time window.",
                ]);
            }

            if ($other->vehicle_id === $vehicleId) {
                throw ValidationException::withMessages([
                    'vehicle_id' => "Vehicle is already assigned to {$other->run->name} during this time window.",
                ]);
            }
        }
    }

    private function ensureRouteRunsOnDate(Route $route, Carbon $serviceDate): void
    {
        $dayOfWeek = $serviceDate->dayOfWeekIso;
        $days = $route->days_of_week ?? [];

        if (empty($days) || ! is_array($days)) {
            return;
        }

        if (in_array($dayOfWeek, $days, true)) {
            return;
        }

        $route->update([
            'days_of_week' => array_values(array_unique([...$days, $dayOfWeek])),
        ]);
    }

    private function normalizeTime(string $time): string
    {
        $parts = explode(':', $time);
        $hour = str_pad((string) (int) ($parts[0] ?? 0), 2, '0', STR_PAD_LEFT);
        $minute = str_pad((string) (int) ($parts[1] ?? 0), 2, '0', STR_PAD_LEFT);

        return "{$hour}:{$minute}:00";
    }

    private function timeToMinutes(?string $time): int
    {
        if (! $time) {
            return 0;
        }

        [$hour, $minute] = array_pad(explode(':', $time), 2, 0);

        return ((int) $hour * 60) + (int) $minute;
    }

    private function timesOverlap(int $aStart, int $aEnd, int $bStart, int $bEnd): bool
    {
        if ($aEnd <= $aStart) {
            $aEnd = $aStart + 60;
        }
        if ($bEnd <= $bStart) {
            $bEnd = $bStart + 60;
        }

        return $aStart < $bEnd && $bStart < $aEnd;
    }
}
