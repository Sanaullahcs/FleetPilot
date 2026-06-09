<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\ParentAccount;
use App\Models\ParentStudent;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ParentController extends Controller
{
    use ResolvesAccessScope;
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $orgId = $request->user()->organization_id;

        $query = ParentAccount::query()
            ->where('parent_accounts.organization_id', $orgId)
            ->with('user:id,email,first_name,last_name,phone,is_active,last_login_at')
            ->withCount('students')
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('email', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->has('is_active'), function ($q) use ($request) {
                $q->whereHas('user', fn ($u) => $u->where('is_active', $request->boolean('is_active')));
            })
            ->when($request->string('students_assignment')->toString() === 'with_students', fn ($q) => $q->has('students'))
            ->when($request->string('students_assignment')->toString() === 'without_students', fn ($q) => $q->doesntHave('students'));

        $sortBy = $request->string('sort_by')->toString() ?: 'last_name';
        $sortDir = $request->string('sort_dir')->toString() === 'desc' ? 'desc' : 'asc';
        $userSorts = ['first_name', 'last_name', 'email', 'is_active', 'last_login_at'];

        if (in_array($sortBy, $userSorts, true)) {
            $query->join('users', 'users.id', '=', 'parent_accounts.user_id')
                ->select('parent_accounts.*')
                ->orderBy('users.'.$sortBy, $sortDir);
        } else {
            $this->applyListSort($query, $request, ['relationship', 'preferred_language', 'created_at'], 'created_at');
        }

        $parents = $query->paginate($request->integer('per_page', 15));

        $parents->getCollection()->transform(fn (ParentAccount $parent) => $this->formatParent($parent));

        return response()->json($parents);
    }

    public function show(Request $request, ParentAccount $parentAccount): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeOrg($request, $parentAccount);

        $parentAccount->load([
            'user:id,email,first_name,last_name,phone,is_active,last_login_at',
        ])->loadCount('students');

        return response()->json([
            'data' => $this->formatParent($parentAccount, true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $orgId = $request->user()->organization_id;
        $data = $this->validateParentData($request, true);

        $parent = DB::transaction(function () use ($orgId, $data) {
            $user = User::create([
                'organization_id' => $orgId,
                'email' => $data['email'],
                'password_hash' => $data['password'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? null,
                'role' => 'parent',
                'is_active' => $data['is_active'] ?? true,
                'email_verified_at' => ($data['is_active'] ?? true) ? now() : null,
            ]);

            $role = Role::query()->where('organization_id', $orgId)->where('slug', 'parent')->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }

            return ParentAccount::create([
                'organization_id' => $orgId,
                'user_id' => $user->id,
                'relationship' => $data['relationship'] ?? null,
                'preferred_language' => $data['preferred_language'] ?? 'en',
            ]);
        });

        $parent->load('user:id,email,first_name,last_name,phone,is_active,last_login_at')->loadCount('students');

        return response()->json(['data' => $this->formatParent($parent)], 201);
    }

    public function update(Request $request, ParentAccount $parentAccount): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeOrg($request, $parentAccount);

        $data = $this->validateParentData($request, false, $parentAccount);
        $user = $parentAccount->user;

        if (! $user) {
            abort(404, 'Parent user account not found.');
        }

        DB::transaction(function () use ($parentAccount, $user, $data) {
            $user->update([
                'email' => $data['email'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? $user->is_active,
            ]);

            if (isset($data['password'])) {
                $user->update(['password_hash' => $data['password']]);
            }

            $parentAccount->update([
                'relationship' => $data['relationship'] ?? $parentAccount->relationship,
                'preferred_language' => $data['preferred_language'] ?? $parentAccount->preferred_language,
            ]);
        });

        $parentAccount->refresh()->load('user:id,email,first_name,last_name,phone,is_active,last_login_at')->loadCount('students');

        return response()->json(['data' => $this->formatParent($parentAccount)]);
    }

    public function destroy(Request $request, ParentAccount $parentAccount): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeOrg($request, $parentAccount);

        DB::transaction(function () use ($parentAccount) {
            $user = $parentAccount->user;
            $parentAccount->delete();
            if ($user && $user->role === 'parent') {
                $user->delete();
            }
        });

        return response()->json(['message' => 'Parent deleted.']);
    }

    public function listStudents(Request $request, ParentAccount $parentAccount): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeOrg($request, $parentAccount);

        $links = ParentStudent::query()
            ->where('parent_account_id', $parentAccount->id)
            ->with([
                'student:id,student_number,first_name,last_name,grade,status,school_id',
                'student.school:id,name,code',
            ])
            ->orderByDesc('is_primary')
            ->orderBy('created_at')
            ->get()
            ->map(fn (ParentStudent $link) => $this->formatStudentLink($link));

        return response()->json(['data' => $links]);
    }

    public function linkStudent(Request $request, ParentAccount $parentAccount): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeOrg($request, $parentAccount);

        $orgId = $parentAccount->organization_id;
        $data = $request->validate([
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'relationship' => ['nullable', Rule::in(['mother', 'father', 'guardian', 'grandparent', 'other'])],
            'is_primary' => ['boolean'],
            'can_pickup' => ['boolean'],
        ]);

        $student = Student::forOrganization($orgId)->find($data['student_id']);
        if (! $student) {
            throw ValidationException::withMessages([
                'student_id' => ['Student not found in your organization.'],
            ]);
        }

        if (ParentStudent::where('parent_account_id', $parentAccount->id)->where('student_id', $student->id)->exists()) {
            throw ValidationException::withMessages([
                'student_id' => ['This student is already linked to the parent.'],
            ]);
        }

        if (! empty($data['is_primary'])) {
            ParentStudent::where('student_id', $student->id)->update(['is_primary' => false]);
        }

        $link = ParentStudent::create([
            'parent_account_id' => $parentAccount->id,
            'student_id' => $student->id,
            'relationship' => $data['relationship'] ?? $parentAccount->relationship,
            'is_primary' => $data['is_primary'] ?? false,
            'can_pickup' => $data['can_pickup'] ?? true,
        ]);

        $link->load([
            'student:id,student_number,first_name,last_name,grade,status,school_id',
            'student.school:id,name,code',
        ]);

        return response()->json([
            'data' => $this->formatStudentLink($link),
            'message' => 'Student linked to parent.',
        ], 201);
    }

    public function unlinkStudent(Request $request, ParentAccount $parentAccount, ParentStudent $parentStudent): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeOrg($request, $parentAccount);

        if ($parentStudent->parent_account_id !== $parentAccount->id) {
            abort(404);
        }

        $parentStudent->delete();

        return response()->json(['message' => 'Student unlinked from parent.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatParent(ParentAccount $parent, bool $includeStudents = false): array
    {
        $payload = [
            'id' => $parent->id,
            'relationship' => $parent->relationship,
            'preferred_language' => $parent->preferred_language,
            'students_count' => $parent->students_count ?? $parent->students()->count(),
            'user' => $parent->user ? [
                'id' => $parent->user->id,
                'email' => $parent->user->email,
                'first_name' => $parent->user->first_name,
                'last_name' => $parent->user->last_name,
                'phone' => $parent->user->phone,
                'is_active' => $parent->user->is_active,
                'last_login_at' => $parent->user->last_login_at?->toIso8601String(),
            ] : null,
            'created_at' => $parent->created_at?->toIso8601String(),
        ];

        if ($includeStudents) {
            $payload['students'] = ParentStudent::query()
                ->where('parent_account_id', $parent->id)
                ->with([
                    'student:id,student_number,first_name,last_name,grade,status,school_id',
                    'student.school:id,name,code',
                ])
                ->orderByDesc('is_primary')
                ->get()
                ->map(fn (ParentStudent $link) => $this->formatStudentLink($link))
                ->all();
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatStudentLink(ParentStudent $link): array
    {
        return [
            'id' => $link->id,
            'relationship' => $link->relationship,
            'is_primary' => $link->is_primary,
            'can_pickup' => $link->can_pickup,
            'student' => $link->student ? [
                'id' => $link->student->id,
                'student_number' => $link->student->student_number,
                'first_name' => $link->student->first_name,
                'last_name' => $link->student->last_name,
                'grade' => $link->student->grade,
                'status' => $link->student->status,
                'school' => $link->student->school ? [
                    'id' => $link->student->school->id,
                    'name' => $link->student->school->name,
                    'code' => $link->student->school->code,
                ] : null,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validateParentData(Request $request, bool $creating, ?ParentAccount $parentAccount = null): array
    {
        $userId = $parentAccount?->user_id;

        $rules = [
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'relationship' => ['nullable', Rule::in(['mother', 'father', 'guardian', 'grandparent', 'other'])],
            'preferred_language' => ['nullable', 'string', 'max:10'],
            'is_active' => ['boolean'],
        ];

        if ($creating) {
            $rules['password'] = ['required', 'confirmed', Password::min(8)];
        } else {
            $rules['password'] = ['nullable', 'confirmed', Password::min(8)];
        }

        return $request->validate($rules);
    }

    private function authorizeOrg(Request $request, ParentAccount $parent): void
    {
        abort_unless($parent->organization_id === $request->user()->organization_id, 404);
    }
}
