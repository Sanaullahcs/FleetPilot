<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ContractorAssignment;
use App\Models\ParentAccount;
use App\Models\ParentStudent;
use App\Models\Route;
use App\Models\RunAssignment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ResolvesAccessScope
{
    /**
     * Student IDs linked to a parent user, or null when not a parent.
     *
     * @return array<int, string>|null
     */
    protected function parentStudentIds(User $user): ?array
    {
        if ($user->role !== 'parent') {
            return null;
        }

        $accountId = ParentAccount::where('user_id', $user->id)->value('id');
        if (! $accountId) {
            return [];
        }

        return ParentStudent::where('parent_account_id', $accountId)->pluck('student_id')->all();
    }

    protected function schoolScopeId(User $user): ?string
    {
        if ($user->role === 'school_contact' && $user->school_id) {
            return $user->school_id;
        }

        return null;
    }

    protected function assertOpsRole(Request $request): void
    {
        if (! in_array($request->user()->role, ['admin', 'dispatcher', 'school_contact', 'contractor'], true)) {
            abort(403, 'This action is not available for your role.');
        }
    }

    // --- Contractor scoping -------------------------------------------------

    protected function isContractor(User $user): bool
    {
        return $user->role === 'contractor';
    }

    /**
     * School IDs a contractor may see: schools assigned directly plus the
     * schools that own any routes assigned directly. Null when not a contractor.
     *
     * @return array<int, string>|null
     */
    protected function contractorSchoolIds(User $user): ?array
    {
        if (! $this->isContractor($user)) {
            return null;
        }

        $assignments = ContractorAssignment::query()
            ->where('contractor_id', $user->id)
            ->get(['school_id', 'route_id']);

        $schoolIds = $assignments->pluck('school_id')->filter();
        $routeIds = $assignments->pluck('route_id')->filter();

        if ($routeIds->isNotEmpty()) {
            $schoolIds = $schoolIds->merge(
                Route::whereIn('id', $routeIds->all())->pluck('school_id')->filter()
            );
        }

        return $schoolIds->unique()->values()->all();
    }

    /**
     * Route IDs a contractor may operate: routes assigned directly plus every
     * route belonging to a school assigned to them. Null when not a contractor.
     *
     * @return array<int, string>|null
     */
    protected function contractorRouteIds(User $user): ?array
    {
        if (! $this->isContractor($user)) {
            return null;
        }

        $assignments = ContractorAssignment::query()
            ->where('contractor_id', $user->id)
            ->get(['school_id', 'route_id']);

        $routeIds = $assignments->pluck('route_id')->filter();
        $schoolIds = $assignments->pluck('school_id')->filter();

        if ($schoolIds->isNotEmpty()) {
            $routeIds = $routeIds->merge(
                Route::whereIn('school_id', $schoolIds->all())->pluck('id')
            );
        }

        return $routeIds->unique()->values()->all();
    }

    /**
     * Restrict a Route query to a contractor's assigned routes.
     *
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    protected function applyContractorRouteScope(User $user, Builder $query): Builder
    {
        $routeIds = $this->contractorRouteIds($user);
        if ($routeIds === null) {
            return $query;
        }

        return $query->whereIn('id', $routeIds ?: ['__none__']);
    }

    /**
     * Restrict a Driver/Vehicle query to those owned by the contractor.
     *
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    protected function applyContractorOwnedScope(User $user, Builder $query): Builder
    {
        if (! $this->isContractor($user)) {
            return $query;
        }

        return $query->where('contractor_id', $user->id);
    }

    protected function assertCanManageStudents(Request $request): void
    {
        if (! in_array($request->user()->role, ['admin', 'dispatcher', 'school_contact'], true)) {
            abort(403, 'Only administrators and school contacts can manage students and parents.');
        }
    }

    protected function authorizeStudentInSchoolScope(User $user, Student $student): void
    {
        abort_unless($student->organization_id === $user->organization_id, 404);

        $schoolId = $this->schoolScopeId($user);
        if ($schoolId && $student->school_id !== $schoolId) {
            abort(403, 'You can only manage students at your school.');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function applySchoolContactStudentScope(User $user, array $data): array
    {
        $schoolId = $this->schoolScopeId($user);
        if (! $schoolId) {
            return $data;
        }

        if (($data['school_id'] ?? null) !== $schoolId) {
            abort(403, 'School contacts can only manage students at their assigned school.');
        }

        $data['school_id'] = $schoolId;

        return $data;
    }

    protected function authorizeParentInSchoolScope(User $user, ParentAccount $parent): void
    {
        abort_unless($parent->organization_id === $user->organization_id, 404);

        $schoolId = $this->schoolScopeId($user);
        if (! $schoolId) {
            return;
        }

        $hasSchoolStudent = $parent->students()->where('school_id', $schoolId)->exists();
        $hasNoStudents = ! $parent->students()->exists();

        if (! $hasSchoolStudent && ! $hasNoStudents) {
            abort(403, 'You can only manage parents linked to your school.');
        }
    }

    /**
     * Limit driver queries to those serving a school contact's campus.
     *
     * @param  Builder<\Illuminate\Database\Eloquent\Model>  $query
     * @return Builder<\Illuminate\Database\Eloquent\Model>
     */
    protected function applySchoolDriverScope(User $user, Builder $query): Builder
    {
        $schoolId = $this->schoolScopeId($user);
        if (! $schoolId) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($schoolId) {
            $q->whereHas('students', fn (Builder $s) => $s->where('school_id', $schoolId))
                ->orWhereIn('id', RunAssignment::query()
                    ->select('driver_id')
                    ->whereDate('service_date', today())
                    ->whereNotNull('driver_id')
                    ->whereHas('run.route', fn (Builder $r) => $r->where('school_id', $schoolId)));
        });
    }

    protected function authorizeDriverInSchoolScope(User $user, \App\Models\Driver $driver): void
    {
        abort_unless($driver->organization_id === $user->organization_id, 404);

        $schoolId = $this->schoolScopeId($user);
        if (! $schoolId) {
            return;
        }

        $servesSchool = Student::query()
            ->where('assigned_driver_id', $driver->id)
            ->where('school_id', $schoolId)
            ->exists();

        if ($servesSchool) {
            return;
        }

        $onSchoolRun = RunAssignment::query()
            ->where('driver_id', $driver->id)
            ->whereDate('service_date', today())
            ->whereHas('run.route', fn (Builder $r) => $r->where('school_id', $schoolId))
            ->exists();

        abort_unless($onSchoolRun, 403, 'You can only view drivers serving your school.');
    }
}
