<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesVehiclePosition;
use App\Models\ParentAccount;
use App\Models\Route;
use App\Models\Run;
use App\Models\RunAssignment;
use App\Models\Student;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ParentPortalController extends Controller
{
    use ResolvesVehiclePosition;

    public function tracking(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'parent') {
            abort(403, 'Live tracking is only available to parent accounts.');
        }

        $account = ParentAccount::query()->where('user_id', $user->id)->first();
        if (! $account) {
            return response()->json([
                'data' => [
                    'updated_at' => now()->toIso8601String(),
                    'center' => ['lat' => 39.7817, 'lng' => -89.6501],
                    'tracks' => [],
                ],
            ]);
        }

        $students = Student::query()
            ->whereIn('id', function ($q) use ($account) {
                $q->select('student_id')
                    ->from('parent_students')
                    ->where('parent_account_id', $account->id);
            })
            ->with([
                'school:id,name,code,latitude,longitude',
                'assignedDriver:id,first_name,last_name,employee_id,phone,default_vehicle_id',
                'assignedDriver.defaultVehicle:id,vehicle_number,type,status,license_plate',
            ])
            ->orderBy('last_name')
            ->get();

        $today = Carbon::today();
        $now = Carbon::now();
        $tracks = [];

        foreach ($students->values() as $index => $student) {
            $track = $this->buildStudentTrack($student, $today, $index, $now);
            if ($track) {
                $tracks[] = $track;
            }
        }

        $centerPoints = array_map(
            fn (array $track) => ['latitude' => $track['vehicle']['latitude'], 'longitude' => $track['vehicle']['longitude']],
            $tracks,
        );

        if ($centerPoints === [] && $students->isNotEmpty()) {
            $school = $students->first()?->school;
            $defaultLat = (float) ($school?->latitude ?? 39.7817);
            $defaultLng = (float) ($school?->longitude ?? -89.6501);
            $center = ['lat' => $defaultLat, 'lng' => $defaultLng];
        } else {
            $center = $this->geoCenter($centerPoints);
        }

        return response()->json([
            'data' => [
                'updated_at' => $now->toIso8601String(),
                'center' => $center,
                'tracks' => $tracks,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildStudentTrack(Student $student, Carbon $today, int $index, Carbon $now): ?array
    {
        $runIds = Route::query()
            ->where('school_id', $student->school_id)
            ->where('status', 'active')
            ->with(['runs' => fn ($q) => $q->where('status', 'active')])
            ->get()
            ->flatMap(fn (Route $route) => $route->runs->pluck('id'))
            ->all();

        $assignments = RunAssignment::query()
            ->whereDate('service_date', $today)
            ->whereIn('run_id', $runIds ?: ['00000000-0000-0000-0000-000000000000'])
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->with([
                'driver:id,first_name,last_name,employee_id,phone',
                'vehicle:id,vehicle_number,type,status,license_plate',
                'run:id,route_id,name,scheduled_start_time,scheduled_end_time,direction,status',
                'run.route:id,name,code,type,school_id',
                'run.route.school:id,name,code',
            ])
            ->get()
            ->sortByDesc(fn (RunAssignment $a) => $a->status === 'in_progress' ? 1 : 0);

        $assignment = $assignments->first(fn (RunAssignment $a) => $a->status === 'in_progress' && $a->vehicle)
            ?? $assignments->first(fn (RunAssignment $a) => $a->vehicle);

        $vehicle = $assignment?->vehicle ?? $student->assignedDriver?->defaultVehicle;
        $trackingStatus = 'unavailable';

        if ($assignment?->status === 'in_progress') {
            $trackingStatus = 'in_progress';
        } elseif ($assignment) {
            $trackingStatus = 'scheduled';
        } elseif ($vehicle) {
            $trackingStatus = 'assigned';
        }

        if (! $vehicle) {
            return [
                'student_id' => $student->id,
                'student_name' => trim("{$student->first_name} {$student->last_name}"),
                'tracking_status' => 'unavailable',
                'run' => null,
                'vehicle' => null,
            ];
        }

        $position = $this->resolveVehiclePosition($vehicle, $index, $now);
        $driver = $assignment?->driver ?? $student->assignedDriver;

        return [
            'student_id' => $student->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'tracking_status' => $trackingStatus,
            'school' => $student->school ? [
                'id' => $student->school->id,
                'name' => $student->school->name,
                'code' => $student->school->code,
            ] : null,
            'run' => $assignment?->run ? [
                'id' => $assignment->run->id,
                'name' => $assignment->run->name,
                'direction' => $assignment->run->direction,
                'scheduled_start_time' => $assignment->run->scheduled_start_time,
                'scheduled_end_time' => $assignment->run->scheduled_end_time,
                'status' => $assignment->status,
                'route_name' => $assignment->run->route?->name,
                'route_type' => $assignment->run->route?->type,
            ] : null,
            'vehicle' => [
                'id' => $vehicle->id,
                'vehicle_number' => $vehicle->vehicle_number,
                'type' => $vehicle->type,
                'status' => $vehicle->status,
                'license_plate' => $vehicle->license_plate,
                'latitude' => $position['latitude'],
                'longitude' => $position['longitude'],
                'heading' => $position['heading'],
                'speed_mph' => $position['speed_mph'],
                'recorded_at' => $position['recorded_at'],
                'is_simulated' => $position['is_simulated'],
                'driver' => $driver ? [
                    'id' => $driver->id,
                    'first_name' => $driver->first_name,
                    'last_name' => $driver->last_name,
                    'employee_id' => $driver->employee_id,
                    'phone' => $driver->phone,
                ] : null,
            ],
        ];
    }

    public function children(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'parent') {
            abort(403, 'This view is only available to parent accounts.');
        }

        $account = ParentAccount::query()
            ->where('user_id', $user->id)
            ->first();

        if (! $account) {
            return response()->json(['data' => []]);
        }

        $students = Student::query()
            ->whereIn('id', function ($q) use ($account) {
                $q->select('student_id')
                    ->from('parent_students')
                    ->where('parent_account_id', $account->id);
            })
            ->with([
                'school:id,name,code,city',
                'assignedDriver:id,first_name,last_name,employee_id,phone,email,status,default_vehicle_id',
                'assignedDriver.defaultVehicle:id,vehicle_number,type',
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $today = Carbon::today();
        $dayOfWeek = $today->dayOfWeekIso;

        $items = $students->map(function (Student $student) use ($today, $dayOfWeek) {
            $routes = Route::query()
                ->where('school_id', $student->school_id)
                ->where('status', 'active')
                ->with([
                    'runs' => fn ($q) => $q->where('status', 'active')->orderBy('scheduled_start_time'),
                ])
                ->orderBy('type')
                ->get()
                ->filter(function (Route $route) use ($dayOfWeek) {
                    $days = $route->days_of_week;
                    if (empty($days) || ! is_array($days)) {
                        return true;
                    }

                    return in_array($dayOfWeek, $days, true);
                })
                ->values();

            $runIds = $routes->flatMap(fn (Route $route) => $route->runs->pluck('id'))->all();

            $assignments = RunAssignment::query()
                ->whereDate('service_date', $today)
                ->whereIn('run_id', $runIds ?: ['00000000-0000-0000-0000-000000000000'])
                ->where('status', '!=', 'cancelled')
                ->with([
                    'driver:id,first_name,last_name,employee_id,phone',
                    'vehicle:id,vehicle_number,type',
                    'run:id,route_id,name,scheduled_start_time,scheduled_end_time,direction',
                ])
                ->get()
                ->keyBy('run_id');

            $routesPayload = $routes->map(function (Route $route) use ($assignments) {
                $runs = $route->runs->map(function (Run $run) use ($assignments) {
                    $assignment = $assignments->get($run->id);

                    return [
                        'id' => $run->id,
                        'name' => $run->name,
                        'direction' => $run->direction,
                        'scheduled_start_time' => $run->scheduled_start_time,
                        'scheduled_end_time' => $run->scheduled_end_time,
                        'assignment' => $assignment ? [
                            'status' => $assignment->status,
                            'driver' => $assignment->driver ? [
                                'id' => $assignment->driver->id,
                                'first_name' => $assignment->driver->first_name,
                                'last_name' => $assignment->driver->last_name,
                                'employee_id' => $assignment->driver->employee_id,
                                'phone' => $assignment->driver->phone,
                            ] : null,
                            'vehicle' => $assignment->vehicle ? [
                                'id' => $assignment->vehicle->id,
                                'vehicle_number' => $assignment->vehicle->vehicle_number,
                                'type' => $assignment->vehicle->type,
                            ] : null,
                        ] : null,
                    ];
                })->values()->all();

                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'code' => $route->code,
                    'type' => $route->type,
                    'runs' => $runs,
                ];
            })->values()->all();

            return [
                'student' => [
                    'id' => $student->id,
                    'student_number' => $student->student_number,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'grade' => $student->grade,
                    'status' => $student->status,
                ],
                'school' => $student->school ? [
                    'id' => $student->school->id,
                    'name' => $student->school->name,
                    'code' => $student->school->code,
                    'city' => $student->school->city,
                ] : null,
                'assigned_driver' => $student->assignedDriver ? [
                    'id' => $student->assignedDriver->id,
                    'first_name' => $student->assignedDriver->first_name,
                    'last_name' => $student->assignedDriver->last_name,
                    'employee_id' => $student->assignedDriver->employee_id,
                    'phone' => $student->assignedDriver->phone,
                    'email' => $student->assignedDriver->email,
                    'status' => $student->assignedDriver->status,
                    'vehicle' => $student->assignedDriver->defaultVehicle ? [
                        'id' => $student->assignedDriver->defaultVehicle->id,
                        'vehicle_number' => $student->assignedDriver->defaultVehicle->vehicle_number,
                        'type' => $student->assignedDriver->defaultVehicle->type,
                    ] : null,
                ] : null,
                'routes_today' => $routesPayload,
                'service_date' => $today->toDateString(),
            ];
        })->values()->all();

        return response()->json(['data' => $items]);
    }
}
