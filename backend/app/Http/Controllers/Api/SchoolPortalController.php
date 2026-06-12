<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RunAssignment;
use App\Models\School;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SchoolPortalController extends Controller
{
    public function portal(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'school_contact') {
            abort(403, 'The school portal is only available to school contacts.');
        }

        if (! $user->school_id) {
            return response()->json([
                'data' => [
                    'school' => null,
                    'stats' => [
                        'students_total' => 0,
                        'students_active' => 0,
                        'routes_active' => 0,
                        'runs_today' => 0,
                    ],
                    'routes' => [],
                    'today_assignments' => [],
                    'alerts' => [[
                        'id' => 'no_school_linked',
                        'severity' => 'warning',
                        'title' => 'School not linked',
                        'message' => 'Your account is not linked to a school yet. Contact your transportation administrator.',
                    ]],
                ],
            ]);
        }

        $school = School::query()
            ->where('organization_id', $user->organization_id)
            ->where('id', $user->school_id)
            ->withCount([
                'students',
                'students as active_students_count' => fn ($q) => $q->where('status', 'active'),
                'routes',
                'routes as active_routes_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->firstOrFail();

        $today = Carbon::today();

        $routes = Route::query()
            ->where('organization_id', $user->organization_id)
            ->where('school_id', $school->id)
            ->where('status', 'active')
            ->withCount('runs')
            ->with(['runs' => fn ($q) => $q->orderBy('scheduled_start_time')])
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (Route $route) => [
                'id' => $route->id,
                'name' => $route->name,
                'code' => $route->code,
                'type' => $route->type,
                'status' => $route->status,
                'runs_count' => $route->runs_count,
                'runs' => $route->runs->map(fn ($run) => [
                    'id' => $run->id,
                    'name' => $run->name,
                    'direction' => $run->direction,
                    'scheduled_start_time' => $run->scheduled_start_time,
                    'scheduled_end_time' => $run->scheduled_end_time,
                    'status' => $run->status,
                ])->values()->all(),
            ])
            ->values()
            ->all();

        $todayAssignments = RunAssignment::query()
            ->whereDate('service_date', $today)
            ->whereHas('run.route', fn ($q) => $q->where('school_id', $school->id))
            ->with([
                'run:id,name,direction,scheduled_start_time,route_id',
                'run.route:id,name,code,type',
                'driver:id,first_name,last_name,employee_id,phone',
                'vehicle:id,vehicle_number,type,license_plate',
            ])
            ->orderBy('created_at')
            ->get()
            ->map(fn (RunAssignment $assignment) => [
                'id' => $assignment->id,
                'service_date' => $assignment->service_date?->toDateString(),
                'status' => $assignment->status,
                'run' => $assignment->run ? [
                    'id' => $assignment->run->id,
                    'name' => $assignment->run->name,
                    'direction' => $assignment->run->direction,
                    'scheduled_start_time' => $assignment->run->scheduled_start_time,
                ] : null,
                'route' => $assignment->run?->route ? [
                    'id' => $assignment->run->route->id,
                    'name' => $assignment->run->route->name,
                    'code' => $assignment->run->route->code,
                    'type' => $assignment->run->route->type,
                ] : null,
                'driver' => $assignment->driver ? [
                    'id' => $assignment->driver->id,
                    'full_name' => trim("{$assignment->driver->first_name} {$assignment->driver->last_name}"),
                    'employee_id' => $assignment->driver->employee_id,
                    'phone' => $assignment->driver->phone,
                ] : null,
                'vehicle' => $assignment->vehicle ? [
                    'id' => $assignment->vehicle->id,
                    'vehicle_number' => $assignment->vehicle->vehicle_number,
                    'type' => $assignment->vehicle->type,
                    'license_plate' => $assignment->vehicle->license_plate,
                ] : null,
            ])
            ->values()
            ->all();

        $runsToday = collect($todayAssignments)->pluck('run.id')->filter()->unique()->count();

        $alerts = [];
        $unassignedStudents = Student::query()
            ->where('organization_id', $user->organization_id)
            ->where('school_id', $school->id)
            ->where('status', 'active')
            ->whereNull('assigned_driver_id')
            ->count();

        if ($unassignedStudents > 0) {
            $alerts[] = [
                'id' => 'unassigned_students',
                'severity' => 'warning',
                'title' => 'Students without drivers',
                'message' => "{$unassignedStudents} active student(s) at your school do not have an assigned driver.",
            ];
        }

        $delayed = collect($todayAssignments)->whereIn('status', ['delayed', 'cancelled'])->count();
        if ($delayed > 0) {
            $alerts[] = [
                'id' => 'run_disruptions',
                'severity' => 'info',
                'title' => 'Run updates today',
                'message' => "{$delayed} run assignment(s) are delayed or cancelled today.",
            ];
        }

        return response()->json([
            'data' => [
                'school' => [
                    'id' => $school->id,
                    'name' => $school->name,
                    'code' => $school->code,
                    'district' => $school->district,
                    'grade_levels' => $school->grade_levels,
                    'address' => $school->address,
                    'city' => $school->city,
                    'state' => $school->state,
                    'zip' => $school->zip,
                    'phone' => $school->phone,
                    'principal_name' => $school->principal_name,
                    'website' => $school->website,
                    'bell_times' => $school->bell_times,
                    'latitude' => $school->latitude,
                    'longitude' => $school->longitude,
                ],
                'stats' => [
                    'students_total' => $school->students_count,
                    'students_active' => $school->active_students_count,
                    'routes_active' => $school->active_routes_count,
                    'runs_today' => $runsToday,
                ],
                'routes' => $routes,
                'today_assignments' => $todayAssignments,
                'alerts' => $alerts,
            ],
        ]);
    }
}
