<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentStudent;
use App\Models\Route;
use App\Models\Run;
use App\Models\RunAssignment;
use App\Models\School;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SchoolPortalController extends Controller
{
    /** @var array<int, string> */
    private const CHART_FILLS = ['#4F5BA9', '#0EA5E9', '#06B6D4', '#F97316', '#8B5CF6', '#6B76C2', '#38BDF8', '#FB923C', '#10B981', '#14B8A6', '#EC4899', '#F59E0B'];

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
                    'analytics' => $this->emptyAnalytics(),
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
                'contractor:id,first_name,last_name,job_title',
            ])
            ->orderBy('created_at')
            ->get()
            ->map(fn (RunAssignment $assignment) => [
                'id' => $assignment->id,
                'service_date' => $assignment->service_date?->toDateString(),
                'status' => $assignment->status,
                'operated_by' => $assignment->contractor ? [
                    'id' => $assignment->contractor->id,
                    'name' => trim("{$assignment->contractor->first_name} {$assignment->contractor->last_name}"),
                    'company' => $assignment->contractor->job_title,
                ] : null,
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

        $students = Student::query()
            ->where('organization_id', $user->organization_id)
            ->where('school_id', $school->id);

        $routeQuery = Route::query()
            ->where('organization_id', $user->organization_id)
            ->where('school_id', $school->id);

        $runTotal = Run::query()
            ->where('status', 'active')
            ->whereHas('route', fn ($q) => $q->where('school_id', $school->id))
            ->count();

        $parentsCount = ParentStudent::query()
            ->whereHas('student', fn ($q) => $q->where('school_id', $school->id))
            ->distinct('parent_account_id')
            ->count('parent_account_id');

        $driversCount = (clone $students)
            ->whereNotNull('assigned_driver_id')
            ->distinct('assigned_driver_id')
            ->count('assigned_driver_id');

        $assignmentStatuses = collect($todayAssignments)->countBy('status');
        $assignedToday = collect($todayAssignments)->filter(fn ($a) => ! empty($a['driver']))->count();
        $inProgressToday = (int) ($assignmentStatuses['in_progress'] ?? 0);

        $todayService = collect([
            ['name' => 'Completed', 'value' => (int) ($assignmentStatuses['completed'] ?? 0), 'fill' => '#10B981'],
            ['name' => 'In progress', 'value' => $inProgressToday, 'fill' => '#06B6D4'],
            ['name' => 'Scheduled', 'value' => (int) ($assignmentStatuses['scheduled'] ?? 0) + (int) ($assignmentStatuses['assigned'] ?? 0), 'fill' => '#4F5BA9'],
            ['name' => 'Delayed', 'value' => (int) ($assignmentStatuses['delayed'] ?? 0), 'fill' => '#F59E0B'],
            ['name' => 'Cancelled', 'value' => (int) ($assignmentStatuses['cancelled'] ?? 0), 'fill' => '#EF4444'],
        ])->filter(fn ($row) => $row['value'] > 0)->values()->all();

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
                    'parents_count' => $parentsCount,
                    'drivers_count' => $driversCount,
                    'assigned_today' => $assignedToday,
                    'in_progress_today' => $inProgressToday,
                ],
                'analytics' => [
                    'fleet_overview' => [
                        ['name' => 'Students', 'value' => $school->students_count, 'fill' => '#4F5BA9'],
                        ['name' => 'Routes', 'value' => $school->active_routes_count, 'fill' => '#F97316'],
                        ['name' => 'Runs', 'value' => $runTotal, 'fill' => '#10B981'],
                        ['name' => 'Parents', 'value' => $parentsCount, 'fill' => '#0EA5E9'],
                        ['name' => 'Drivers', 'value' => $driversCount, 'fill' => '#06B6D4'],
                    ],
                    'routes_by_type' => $this->routesByTypeChart(clone $routeQuery),
                    'student_status' => $this->groupedChart(
                        (clone $students)->selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
                        fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                        0,
                    ),
                    'students_by_grade' => $this->groupedChart(
                        (clone $students)
                            ->selectRaw("COALESCE(NULLIF(grade, ''), 'Unassigned') as label, COUNT(*) as total")
                            ->groupByRaw("COALESCE(NULLIF(grade, ''), 'Unassigned')")
                            ->orderByDesc('total')
                            ->limit(8)
                            ->get(),
                        fn ($l) => $l === 'Unassigned' ? 'Unassigned' : "Grade {$l}",
                        2,
                    ),
                    'today_service' => $todayService,
                ],
                'routes' => $routes,
                'today_assignments' => $todayAssignments,
                'alerts' => $alerts,
            ],
        ]);
    }

    /** @return array<string, array<int, array<string, mixed>>> */
    private function emptyAnalytics(): array
    {
        return [
            'fleet_overview' => [],
            'routes_by_type' => [],
            'student_status' => [],
            'students_by_grade' => [],
            'today_service' => [],
        ];
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
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Models\Route>  $query
     * @return array<int, array{name: string, value: int, active: int, fill: string}>
     */
    private function routesByTypeChart($query): array
    {
        $labels = [
            'am' => 'Morning (AM)',
            'pm' => 'Afternoon (PM)',
            'midday' => 'Midday',
            'activity' => 'Activity',
            'sped' => 'Special ed',
            'charter' => 'Charter',
        ];

        $rows = $query
            ->selectRaw("type as label, COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active")
            ->groupBy('type')
            ->orderByDesc('total')
            ->get();

        return $rows->values()->map(function ($row, $i) use ($labels) {
            $key = strtolower((string) $row->label);

            return [
                'name' => $labels[$key] ?? ucfirst(str_replace('_', ' ', $key)),
                'value' => (int) $row->total,
                'active' => (int) $row->active,
                'fill' => self::CHART_FILLS[$i % count(self::CHART_FILLS)],
            ];
        })->all();
    }
}
