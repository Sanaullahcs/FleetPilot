<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ParentAccount;
use App\Models\ParentStudent;
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
        if (! in_array($request->user()->role, ['admin', 'dispatcher'], true)) {
            abort(403, 'Only administrators can manage parent links.');
        }
    }
}
