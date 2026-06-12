<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ParentAccount;
use App\Models\ParentStudent;
use App\Models\Student;
use App\Models\User;
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
        if (! in_array($request->user()->role, ['admin', 'dispatcher', 'school_contact'], true)) {
            abort(403, 'This action is not available for your role.');
        }
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
}
