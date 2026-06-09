<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Models\Driver;
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
            ->filter(function (Run $run) use ($dayOfWeek) {
                $days = $run->route?->days_of_week;
                if (empty($days) || ! is_array($days)) {
                    return true;
                }

                return in_array($dayOfWeek, $days, true);
            })
            ->values();

        $items = $runs->map(fn (Run $run) => $this->formatRunRow($run))->all();

        $assigned = collect($items)->filter(fn ($row) => $row['assignment'] !== null)->count();
        $inProgress = collect($items)->filter(fn ($row) => ($row['assignment']['status'] ?? null) === 'in_progress')->count();

        return response()->json([
            'data' => [
                'date' => $date->toDateString(),
                'summary' => [
                    'total' => count($items),
                    'assigned' => $assigned,
                    'unassigned' => count($items) - $assigned,
                    'in_progress' => $inProgress,
                ],
                'runs' => $items,
            ],
        ]);
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
