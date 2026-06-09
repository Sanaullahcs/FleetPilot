<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\RunAssignment;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DriverPortalController extends Controller
{
    public function runsToday(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'driver') {
            abort(403, 'This view is only available to driver accounts.');
        }

        $driver = Driver::query()
            ->where('organization_id', $user->organization_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $driver) {
            return response()->json([
                'data' => [
                    'date' => Carbon::today()->toDateString(),
                    'summary' => ['total' => 0, 'scheduled' => 0, 'in_progress' => 0, 'completed' => 0],
                    'runs' => [],
                ],
            ]);
        }

        $date = Carbon::today();

        $assignments = RunAssignment::query()
            ->where('driver_id', $driver->id)
            ->whereDate('service_date', $date)
            ->where('status', '!=', 'cancelled')
            ->with([
                'run:id,route_id,name,scheduled_start_time,scheduled_end_time,direction,status',
                'run.route:id,name,code,type,school_id',
                'run.route.school:id,name,code',
                'vehicle:id,vehicle_number,type,license_plate',
            ])
            ->orderBy('service_date')
            ->get()
            ->sortBy(fn (RunAssignment $a) => $a->run?->scheduled_start_time ?? '99:99')
            ->values();

        $runs = $assignments->map(function (RunAssignment $assignment) {
            $run = $assignment->run;

            return [
                'assignment_id' => $assignment->id,
                'status' => $assignment->status,
                'actual_start_time' => $assignment->actual_start_time?->toIso8601String(),
                'actual_end_time' => $assignment->actual_end_time?->toIso8601String(),
                'run' => $run ? [
                    'id' => $run->id,
                    'name' => $run->name,
                    'direction' => $run->direction,
                    'scheduled_start_time' => $run->scheduled_start_time,
                    'scheduled_end_time' => $run->scheduled_end_time,
                    'status' => $run->status,
                ] : null,
                'route' => $run?->route ? [
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
                'vehicle' => $assignment->vehicle ? [
                    'id' => $assignment->vehicle->id,
                    'vehicle_number' => $assignment->vehicle->vehicle_number,
                    'type' => $assignment->vehicle->type,
                    'license_plate' => $assignment->vehicle->license_plate,
                ] : null,
            ];
        })->all();

        $summary = [
            'total' => count($runs),
            'scheduled' => collect($runs)->where('status', 'scheduled')->count(),
            'in_progress' => collect($runs)->where('status', 'in_progress')->count(),
            'completed' => collect($runs)->where('status', 'completed')->count(),
        ];

        return response()->json([
            'data' => [
                'date' => $date->toDateString(),
                'driver' => [
                    'id' => $driver->id,
                    'employee_id' => $driver->employee_id,
                    'full_name' => $driver->full_name,
                    'phone' => $driver->phone,
                    'status' => $driver->status,
                ],
                'summary' => $summary,
                'runs' => $runs,
            ],
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'driver') {
            abort(403, 'This view is only available to driver accounts.');
        }

        $driver = Driver::query()
            ->where('organization_id', $user->organization_id)
            ->where('user_id', $user->id)
            ->with(['defaultVehicle:id,vehicle_number,type,license_plate'])
            ->first();

        if (! $driver) {
            abort(404, 'Driver profile not found.');
        }

        $studentCount = Student::query()
            ->where('assigned_driver_id', $driver->id)
            ->where('status', 'active')
            ->count();

        return response()->json([
            'data' => [
                'driver' => [
                    'id' => $driver->id,
                    'employee_id' => $driver->employee_id,
                    'first_name' => $driver->first_name,
                    'last_name' => $driver->last_name,
                    'full_name' => $driver->full_name,
                    'email' => $driver->email,
                    'phone' => $driver->phone,
                    'status' => $driver->status,
                    'license_number' => $driver->license_number,
                    'license_class' => $driver->license_class,
                    'license_expiry' => $driver->license_expiry?->toDateString(),
                    'medical_cert_expiry' => $driver->medical_cert_expiry?->toDateString(),
                    'hire_date' => $driver->hire_date?->toDateString(),
                    'address' => $driver->address,
                    'emergency_contact_name' => $driver->emergency_contact_name,
                    'emergency_contact_phone' => $driver->emergency_contact_phone,
                    'default_vehicle' => $driver->defaultVehicle ? [
                        'id' => $driver->defaultVehicle->id,
                        'vehicle_number' => $driver->defaultVehicle->vehicle_number,
                        'type' => $driver->defaultVehicle->type,
                        'license_plate' => $driver->defaultVehicle->license_plate,
                    ] : null,
                ],
                'stats' => [
                    'assigned_students' => $studentCount,
                ],
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'driver') {
            abort(403, 'This view is only available to driver accounts.');
        }

        $driver = Driver::query()
            ->where('organization_id', $user->organization_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $driver) {
            abort(404, 'Driver profile not found.');
        }

        $data = $request->validate([
            'phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ]);

        DB::transaction(function () use ($user, $driver, $data) {
            $driver->update($data);

            if (array_key_exists('phone', $data)) {
                $user->update(['phone' => $data['phone']]);
            }
        });

        return $this->profile($request);
    }

    public function assignmentShow(Request $request, RunAssignment $assignment): JsonResponse
    {
        $user = $request->user();
        $driver = $this->resolveDriver($user);

        if ($assignment->driver_id !== $driver->id) {
            abort(403, 'This assignment is not assigned to you.');
        }

        $assignment->load([
            'run.route.school',
            'vehicle:id,vehicle_number,type,license_plate',
        ]);

        $run = $assignment->run;
        $runId = $run?->id;

        $stopRows = DB::table('run_stops')
            ->join('stops', 'stops.id', '=', 'run_stops.stop_id')
            ->where('run_stops.run_id', $runId)
            ->orderBy('run_stops.sequence')
            ->get([
                'run_stops.id',
                'run_stops.sequence',
                'run_stops.scheduled_time',
                'run_stops.estimated_arrival',
                'run_stops.stop_id',
                'stops.name',
                'stops.address',
                'stops.latitude',
                'stops.longitude',
                'stops.type',
            ]);

        $studentsByStop = $this->studentsGroupedByStop($driver, $run);
        $allStudents = $studentsByStop->flatten(1)->unique('id')->values();

        $completions = DB::table('assignment_stop_completions')
            ->where('run_assignment_id', $assignment->id)
            ->get(['run_stop_id', 'completed_at'])
            ->keyBy('run_stop_id');

        $stops = $stopRows->map(function ($row) use ($studentsByStop, $completions) {
            $completed = $completions->get($row->id);

            return [
                'id' => $row->id,
                'stop_id' => $row->stop_id,
                'sequence' => $row->sequence,
                'name' => $row->name,
                'address' => $row->address,
                'latitude' => (float) $row->latitude,
                'longitude' => (float) $row->longitude,
                'type' => $row->type,
                'scheduled_time' => $row->scheduled_time,
                'estimated_arrival' => $row->estimated_arrival,
                'status' => $completed ? 'completed' : 'pending',
                'completed_at' => $completed?->completed_at
                    ? Carbon::parse($completed->completed_at)->toIso8601String()
                    : null,
                'students' => $studentsByStop->get($row->stop_id, collect())->values()->all(),
            ];
        })->all();

        $completedCount = collect($stops)->where('status', 'completed')->count();

        $students = $allStudents->isNotEmpty()
            ? $allStudents->all()
            : $this->loadRunStudents($driver, $run)->map(fn (Student $s) => $this->formatStudentPayload($s))->values()->all();

        return response()->json([
            'data' => [
                'assignment' => [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'service_date' => $assignment->service_date->toDateString(),
                    'actual_start_time' => $assignment->actual_start_time?->toIso8601String(),
                    'actual_end_time' => $assignment->actual_end_time?->toIso8601String(),
                ],
                'run' => $run ? [
                    'id' => $run->id,
                    'name' => $run->name,
                    'direction' => $run->direction,
                    'scheduled_start_time' => $run->scheduled_start_time,
                    'scheduled_end_time' => $run->scheduled_end_time,
                ] : null,
                'route' => $run?->route ? [
                    'name' => $run->route->name,
                    'code' => $run->route->code,
                    'school' => $run->route->school?->name,
                ] : null,
                'vehicle' => $assignment->vehicle ? [
                    'vehicle_number' => $assignment->vehicle->vehicle_number,
                    'license_plate' => $assignment->vehicle->license_plate,
                ] : null,
                'stops' => $stops,
                'students' => $students,
                'progress' => [
                    'completed_stops' => $completedCount,
                    'total_stops' => count($stops),
                ],
            ],
        ]);
    }

    public function completeStop(Request $request, RunAssignment $assignment, string $runStop): JsonResponse
    {
        $user = $request->user();
        $driver = $this->resolveDriver($user);

        if ($assignment->driver_id !== $driver->id) {
            abort(403, 'This assignment is not assigned to you.');
        }

        if ($assignment->status !== 'in_progress') {
            abort(422, 'Start the run before marking stops complete.');
        }

        $runId = $assignment->run_id;
        $valid = DB::table('run_stops')
            ->where('id', $runStop)
            ->where('run_id', $runId)
            ->exists();

        if (! $valid) {
            abort(404, 'Stop not found on this run.');
        }

        $existing = DB::table('assignment_stop_completions')
            ->where('run_assignment_id', $assignment->id)
            ->where('run_stop_id', $runStop)
            ->first();

        if ($existing) {
            return response()->json([
                'data' => [
                    'run_stop_id' => $runStop,
                    'status' => 'completed',
                    'completed_at' => Carbon::parse($existing->completed_at)->toIso8601String(),
                ],
            ]);
        }

        $completedAt = now();
        DB::table('assignment_stop_completions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'run_assignment_id' => $assignment->id,
            'run_stop_id' => $runStop,
            'completed_at' => $completedAt,
            'created_at' => $completedAt,
            'updated_at' => $completedAt,
        ]);

        $totalStops = DB::table('run_stops')->where('run_id', $runId)->count();
        $doneStops = DB::table('assignment_stop_completions')
            ->where('run_assignment_id', $assignment->id)
            ->count();

        if ($doneStops >= $totalStops && $totalStops > 0) {
            $assignment->update([
                'status' => 'completed',
                'actual_end_time' => now(),
            ]);
        }

        return response()->json([
            'data' => [
                'run_stop_id' => $runStop,
                'status' => 'completed',
                'completed_at' => $completedAt->toIso8601String(),
                'assignment_status' => $assignment->fresh()->status,
            ],
        ], 201);
    }

    public function startAssignment(Request $request, RunAssignment $assignment): JsonResponse
    {
        $user = $request->user();
        $driver = $this->resolveDriver($user);

        if ($assignment->driver_id !== $driver->id) {
            abort(403, 'This assignment is not assigned to you.');
        }

        if ($assignment->status === 'completed' || $assignment->status === 'cancelled') {
            abort(422, 'This run can no longer be started.');
        }

        $assignment->update([
            'status' => 'in_progress',
            'actual_start_time' => $assignment->actual_start_time ?? now(),
        ]);

        return response()->json([
            'data' => [
                'id' => $assignment->id,
                'status' => $assignment->status,
                'actual_start_time' => $assignment->actual_start_time?->toIso8601String(),
            ],
        ]);
    }

    private function resolveDriver($user): Driver
    {
        if ($user->role !== 'driver') {
            abort(403, 'This view is only available to driver accounts.');
        }

        $driver = Driver::query()
            ->where('organization_id', $user->organization_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $driver) {
            abort(404, 'Driver profile not found.');
        }

        return $driver;
    }

    /**
     * @return Collection<string, Collection<int, array<string, mixed>>>
     */
    private function studentsGroupedByStop(Driver $driver, $run): Collection
    {
        if (! $run?->id) {
            return collect();
        }

        $assignments = DB::table('student_stop_assignments')
            ->where('run_id', $run->id)
            ->where('status', 'active')
            ->get(['student_id', 'stop_id']);

        if ($assignments->isEmpty()) {
            $students = $this->loadRunStudents($driver, $run);
            $stopIds = DB::table('run_stops')
                ->join('stops', 'stops.id', '=', 'run_stops.stop_id')
                ->where('run_stops.run_id', $run->id)
                ->where('stops.type', 'student')
                ->orderBy('run_stops.sequence')
                ->pluck('run_stops.stop_id');

            $grouped = collect();
            foreach ($stopIds->values() as $i => $stopId) {
                $student = $students->get($i);
                if ($student) {
                    $grouped->put($stopId, collect([$this->formatStudentPayload($student)]));
                }
            }

            return $grouped;
        }

        $studentIds = $assignments->pluck('student_id')->unique();
        $students = Student::query()
            ->with(['parentAccounts.user:id,first_name,last_name,phone,email'])
            ->whereIn('id', $studentIds)
            ->get()
            ->keyBy('id');

        $grouped = collect();
        foreach ($assignments as $row) {
            $student = $students->get($row->student_id);
            if (! $student) {
                continue;
            }
            $payload = $this->formatStudentPayload($student);
            $grouped->put($row->stop_id, $grouped->get($row->stop_id, collect())->push($payload));
        }

        return $grouped;
    }

    /**
     * @return Collection<int, Student>
     */
    private function loadRunStudents(Driver $driver, $run): Collection
    {
        $schoolId = $run?->route?->school_id;

        return Student::query()
            ->with(['parentAccounts.user:id,first_name,last_name,phone,email'])
            ->where('assigned_driver_id', $driver->id)
            ->where('status', 'active')
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId))
            ->orderBy('last_name')
            ->limit(20)
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatStudentPayload(Student $student): array
    {
        $primary = $student->parentAccounts
            ->sortByDesc(fn ($account) => $account->pivot->is_primary ?? false)
            ->first();

        $parentUser = $primary?->user;
        $parent = null;

        if ($parentUser) {
            $parent = [
                'name' => trim("{$parentUser->first_name} {$parentUser->last_name}"),
                'phone' => $parentUser->phone,
                'relationship' => $primary->pivot->relationship ?? $primary->relationship,
            ];
        } elseif ($student->emergency_contact_name || $student->emergency_contact_phone) {
            $parent = [
                'name' => $student->emergency_contact_name,
                'phone' => $student->emergency_contact_phone,
                'relationship' => 'emergency',
            ];
        }

        return [
            'id' => $student->id,
            'name' => $student->full_name,
            'grade' => $student->grade,
            'address' => $student->home_address,
            'status' => 'expected',
            'parent' => $parent,
        ];
    }
}
