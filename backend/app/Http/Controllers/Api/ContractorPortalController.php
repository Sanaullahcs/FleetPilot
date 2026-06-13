<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Models\ContractorAssignment;
use App\Models\Driver;
use App\Models\Route;
use App\Models\Run;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Read-only portal summary for a logged-in contractor: what the admin has
 * delegated to them plus their own fleet and today's dispatch picture.
 */
class ContractorPortalController extends Controller
{
    use ResolvesAccessScope;

    /** @var array<int, string> */
    private const CHART_FILLS = ['#4F5BA9', '#0EA5E9', '#06B6D4', '#F97316', '#8B5CF6', '#6B76C2', '#38BDF8', '#FB923C', '#10B981', '#14B8A6', '#EC4899', '#F59E0B'];

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'contractor', 403, 'Contractor access required.');

        $orgId = $user->organization_id;
        $routeIds = $this->contractorRouteIds($user) ?? [];
        $schoolIds = $this->contractorSchoolIds($user) ?? [];

        $assignments = ContractorAssignment::where('contractor_id', $user->id)
            ->with([
                'school:id,name,code,city',
                'route:id,name,code,type,school_id',
                'route.school:id,name,code',
            ])
            ->latest()
            ->get();

        $today = Carbon::today();
        $dispatch = $this->dispatchSnapshotForContractor($user, $today);

        $drivers = Driver::forOrganization($orgId)->where('contractor_id', $user->id);
        $vehicles = Vehicle::forOrganization($orgId)->where('contractor_id', $user->id);

        $routes = Route::forOrganization($orgId)
            ->with('school:id,name,code')
            ->whereIn('id', $routeIds ?: ['__none__'])
            ->withCount('runs')
            ->orderBy('name')
            ->get();

        $routeQuery = Route::forOrganization($orgId)->whereIn('id', $routeIds ?: ['__none__']);
        $runTotal = Run::query()
            ->where('status', 'active')
            ->whereHas('route', fn ($q) => $q->whereIn('id', $routeIds ?: ['__none__']))
            ->count();

        $assignedReady = max(0, $dispatch['assigned_today'] - $dispatch['in_progress_today']);

        return response()->json([
            'data' => [
                'contractor' => [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'company_name' => $user->job_title,
                    'email' => $user->email,
                ],
                'summary' => [
                    'schools' => count($schoolIds),
                    'routes' => count($routeIds),
                    'runs_today' => $dispatch['runs_today'],
                    'assigned_today' => $dispatch['assigned_today'],
                    'unassigned_today' => $dispatch['unassigned_today'],
                    'in_progress_today' => $dispatch['in_progress_today'],
                    'drivers' => (clone $drivers)->count(),
                    'active_drivers' => (clone $drivers)->where('status', 'active')->count(),
                    'vehicles' => (clone $vehicles)->count(),
                    'active_vehicles' => (clone $vehicles)->where('status', 'active')->count(),
                ],
                'analytics' => [
                    'fleet_overview' => [
                        ['name' => 'Drivers', 'value' => (clone $drivers)->count(), 'fill' => '#06B6D4'],
                        ['name' => 'Vehicles', 'value' => (clone $vehicles)->count(), 'fill' => '#0EA5E9'],
                        ['name' => 'Routes', 'value' => count($routeIds), 'fill' => '#F97316'],
                        ['name' => 'Schools', 'value' => count($schoolIds), 'fill' => '#6B76C2'],
                        ['name' => 'Runs', 'value' => $runTotal, 'fill' => '#10B981'],
                    ],
                    'routes_by_type' => $this->routesByTypeChart(clone $routeQuery),
                    'driver_status' => $this->groupedChart(
                        (clone $drivers)->selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
                        fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                        3,
                    ),
                    'vehicle_status' => $this->groupedChart(
                        (clone $vehicles)->selectRaw('status as label, COUNT(*) as total')->groupBy('status')->get(),
                        fn ($l) => ucfirst(str_replace('_', ' ', $l)),
                        1,
                    ),
                    'today_dispatch' => array_values(array_filter([
                        ['name' => 'Assigned', 'value' => $assignedReady, 'fill' => '#10B981'],
                        ['name' => 'In progress', 'value' => $dispatch['in_progress_today'], 'fill' => '#06B6D4'],
                        ['name' => 'Open', 'value' => $dispatch['unassigned_today'], 'fill' => '#F59E0B'],
                    ], fn ($row) => $row['value'] > 0)),
                ],
                'assignments' => $assignments,
                'routes' => $routes,
            ],
        ]);
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

    /**
     * Match dispatch board logic: runs scheduled for the service date (day-of-week
     * or explicit assignment), not every active run template on delegated routes.
     *
     * @return array{runs_today: int, assigned_today: int, unassigned_today: int, in_progress_today: int}
     */
    private function dispatchSnapshotForContractor(User $user, Carbon $date): array
    {
        $orgId = $user->organization_id;
        $routeIds = $this->contractorRouteIds($user) ?? [];
        $dayOfWeek = $date->dayOfWeekIso;

        $runs = Run::query()
            ->where('status', 'active')
            ->whereHas('route', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId)->where('status', 'active');
            })
            ->where(function ($q) use ($routeIds, $date, $user) {
                $q->whereHas('route', fn ($r) => $r->whereIn('id', $routeIds ?: ['__none__']))
                    ->orWhereHas('assignments', fn ($a) => $a
                        ->whereDate('service_date', $date)
                        ->where('contractor_id', $user->id)
                        ->where('status', '!=', 'cancelled'));
            })
            ->with([
                'route:id,days_of_week',
                'assignments' => fn ($q) => $q->whereDate('service_date', $date),
            ])
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

        $assignedToday = 0;
        $unassignedToday = 0;
        $inProgressToday = 0;

        foreach ($runs as $run) {
            $assignment = $run->assignments->first(fn ($a) => $a->status !== 'cancelled');
            if ($assignment?->status === 'in_progress') {
                $inProgressToday++;
            }
            if ($assignment?->driver_id) {
                $assignedToday++;
            } else {
                $unassignedToday++;
            }
        }

        return [
            'runs_today' => $runs->count(),
            'assigned_today' => $assignedToday,
            'unassigned_today' => $unassignedToday,
            'in_progress_today' => $inProgressToday,
        ];
    }
}
