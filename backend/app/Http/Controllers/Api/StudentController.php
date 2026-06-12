<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\Driver;
use App\Models\ParentAccount;
use App\Models\ParentStudent;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    use ResolvesAccessScope;
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $parentIds = $this->parentStudentIds($request->user());
        $schoolId = $this->schoolScopeId($request->user());

        $students = Student::forOrganization($orgId)
            ->with([
                'school:id,name,code',
                'assignedDriver:id,first_name,last_name,employee_id,status,email,phone',
            ])
            ->when($parentIds !== null, fn ($q) => $q->whereIn('id', $parentIds ?: ['00000000-0000-0000-0000-000000000000']))
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId))
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('student_number', 'like', "%{$search}%");
                });
            })
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('school_id')->toString(), fn ($q, $schoolId) => $q->where('school_id', $schoolId))
            ->when($request->string('assigned_driver_id')->toString(), fn ($q, $driverId) => $q->where('assigned_driver_id', $driverId))
            ->when($request->string('assignment')->toString() === 'assigned', fn ($q) => $q->whereNotNull('assigned_driver_id'))
            ->when($request->string('assignment')->toString() === 'unassigned', fn ($q) => $q->whereNull('assigned_driver_id'))
            ->when($request->string('grade')->toString(), fn ($q, $grade) => $q->where('grade', $grade));

        $this->applyListSort($students, $request, [
            'student_number', 'first_name', 'last_name', 'grade', 'status',
        ], 'last_name');

        $students = $students->paginate($request->integer('per_page', 15));

        return response()->json($students);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $parentIds = $this->parentStudentIds($request->user());
        $schoolId = $this->schoolScopeId($request->user());

        $students = Student::forOrganization($orgId)
            ->when($parentIds !== null, fn ($q) => $q->whereIn('id', $parentIds ?: ['00000000-0000-0000-0000-000000000000']))
            ->when($schoolId, fn ($q) => $q->where('school_id', $schoolId));

        $total = (clone $students)->count();
        $active = (clone $students)->where('status', 'active')->count();
        $assigned = (clone $students)->where('status', 'active')->whereNotNull('assigned_driver_id')->count();
        $withParents = (clone $students)->where('status', 'active')->whereHas('parentAccounts')->count();
        $specialNeeds = (clone $students)->where('status', 'active')->where(function ($q) {
            $q->where('has_iep', true)
                ->orWhere('requires_wheelchair', true)
                ->orWhere('requires_aide', true);
        })->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'active' => $active,
                'assigned' => $assigned,
                'unassigned' => max(0, $active - $assigned),
                'with_parents' => $withParents,
                'special_needs' => $specialNeeds,
                'assignment_pct' => $active > 0 ? (int) round($assigned / $active * 100) : 0,
            ],
        ]);
    }

    public function show(Request $request, Student $student): JsonResponse
    {
        $this->authorizeStudentAccess($request, $student);

        return response()->json([
            'data' => $student->load([
                'school:id,name,code,city',
                'assignedDriver:id,first_name,last_name,employee_id,status,default_vehicle_id',
                'assignedDriver.defaultVehicle:id,vehicle_number,type',
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $orgId = $request->user()->organization_id;
        $data = $this->validateData($request, $orgId);
        $data['organization_id'] = $orgId;

        $student = Student::create($data);

        return response()->json([
            'data' => $student->load([
                'school:id,name',
                'assignedDriver:id,first_name,last_name',
            ]),
        ], 201);
    }

    public function update(Request $request, Student $student): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        $data = $this->validateData($request, $student->organization_id);
        $student->update($data);

        return response()->json([
            'data' => $student->load([
                'school:id,name',
                'assignedDriver:id,first_name,last_name',
            ]),
        ]);
    }

    public function assignDriver(Request $request, Student $student): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        $data = $request->validate([
            'assigned_driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
        ]);

        $orgId = $student->organization_id;

        if (! empty($data['assigned_driver_id'])) {
            $driver = Driver::where('id', $data['assigned_driver_id'])
                ->where('organization_id', $orgId)
                ->where('status', 'active')
                ->first();
            if (! $driver) {
                throw ValidationException::withMessages([
                    'assigned_driver_id' => ['Selected driver is not valid or not active.'],
                ]);
            }
        }

        $student->update(['assigned_driver_id' => $data['assigned_driver_id'] ?? null]);

        return response()->json([
            'data' => $student->fresh()->load([
                'school:id,name',
                'assignedDriver:id,first_name,last_name,employee_id',
            ]),
            'message' => 'Driver assignment updated.',
        ]);
    }

    public function updateStatus(Request $request, Student $student): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,graduated,transferred'],
        ]);

        $student->update($data);

        return response()->json([
            'data' => $student->fresh()->load([
                'school:id,name',
                'assignedDriver:id,first_name,last_name,employee_id',
            ]),
            'message' => 'Status updated.',
        ]);
    }

    public function destroy(Request $request, Student $student): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        $student->delete();

        return response()->json(['message' => 'Student deleted.']);
    }

    public function listParents(Request $request, Student $student): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        $links = ParentStudent::query()
            ->where('student_id', $student->id)
            ->with([
                'parentAccount.user:id,email,first_name,last_name,is_active',
            ])
            ->orderByDesc('is_primary')
            ->get()
            ->map(fn (ParentStudent $link) => [
                'id' => $link->id,
                'relationship' => $link->relationship,
                'is_primary' => $link->is_primary,
                'can_pickup' => $link->can_pickup,
                'parent_account_id' => $link->parent_account_id,
                'user' => $link->parentAccount?->user ? [
                    'id' => $link->parentAccount->user->id,
                    'email' => $link->parentAccount->user->email,
                    'first_name' => $link->parentAccount->user->first_name,
                    'last_name' => $link->parentAccount->user->last_name,
                    'is_active' => $link->parentAccount->user->is_active,
                ] : null,
            ]);

        return response()->json(['data' => $links]);
    }

    public function linkParent(Request $request, Student $student): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        $orgId = $student->organization_id;
        $data = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'relationship' => ['nullable', Rule::in(['mother', 'father', 'guardian', 'grandparent', 'other'])],
            'is_primary' => ['boolean'],
            'can_pickup' => ['boolean'],
        ]);

        $parentUser = User::query()
            ->where('id', $data['user_id'])
            ->where('organization_id', $orgId)
            ->where('role', 'parent')
            ->first();

        if (! $parentUser) {
            throw ValidationException::withMessages([
                'user_id' => ['Select an active parent user in your organization.'],
            ]);
        }

        $account = ParentAccount::firstOrCreate(
            ['user_id' => $parentUser->id],
            [
                'organization_id' => $orgId,
                'relationship' => $data['relationship'] ?? null,
            ],
        );

        if (ParentStudent::where('parent_account_id', $account->id)->where('student_id', $student->id)->exists()) {
            throw ValidationException::withMessages([
                'user_id' => ['This parent is already linked to the student.'],
            ]);
        }

        if (! empty($data['is_primary'])) {
            ParentStudent::where('student_id', $student->id)->update(['is_primary' => false]);
        }

        $link = ParentStudent::create([
            'parent_account_id' => $account->id,
            'student_id' => $student->id,
            'relationship' => $data['relationship'] ?? null,
            'is_primary' => $data['is_primary'] ?? false,
            'can_pickup' => $data['can_pickup'] ?? true,
        ]);

        $link->load('parentAccount.user:id,email,first_name,last_name,is_active');

        return response()->json([
            'data' => [
                'id' => $link->id,
                'relationship' => $link->relationship,
                'is_primary' => $link->is_primary,
                'can_pickup' => $link->can_pickup,
                'parent_account_id' => $link->parent_account_id,
                'user' => [
                    'id' => $parentUser->id,
                    'email' => $parentUser->email,
                    'first_name' => $parentUser->first_name,
                    'last_name' => $parentUser->last_name,
                    'is_active' => $parentUser->is_active,
                ],
            ],
            'message' => 'Parent linked to student.',
        ], 201);
    }

    public function unlinkParent(Request $request, Student $student, ParentStudent $parentStudent): JsonResponse
    {
        $this->assertCanManageStudents($request);
        $this->authorizeStudentAccess($request, $student);

        if ($parentStudent->student_id !== $student->id) {
            abort(404);
        }

        $parentStudent->delete();

        return response()->json(['message' => 'Parent link removed.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, string $orgId): array
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'student_number' => ['nullable', 'string', 'max:50'],
            'grade' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'assigned_driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
            'home_address' => ['nullable', 'string'],
            'has_iep' => ['boolean'],
            'requires_wheelchair' => ['boolean'],
            'requires_aide' => ['boolean'],
            'status' => ['nullable', 'in:active,inactive,graduated,transferred'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ]);

        $school = School::where('id', $data['school_id'])->where('organization_id', $orgId)->first();
        if (! $school) {
            throw ValidationException::withMessages([
                'school_id' => ['Selected school is not valid for your organization.'],
            ]);
        }

        if (! empty($data['assigned_driver_id'])) {
            $driver = Driver::where('id', $data['assigned_driver_id'])
                ->where('organization_id', $orgId)
                ->where('status', 'active')
                ->first();
            if (! $driver) {
                throw ValidationException::withMessages([
                    'assigned_driver_id' => ['Selected driver is not valid or not active.'],
                ]);
            }
        } else {
            $data['assigned_driver_id'] = null;
        }

        return $data;
    }

    private function authorizeOrg(Request $request, Student $student): void
    {
        abort_unless($student->organization_id === $request->user()->organization_id, 404);
    }

    private function authorizeStudentAccess(Request $request, Student $student): void
    {
        $this->authorizeOrg($request, $student);

        $parentIds = $this->parentStudentIds($request->user());
        if ($parentIds !== null && ! in_array($student->id, $parentIds, true)) {
            abort(403, 'You can only view students linked to your account.');
        }

        $schoolId = $this->schoolScopeId($request->user());
        if ($schoolId && $student->school_id !== $schoolId) {
            abort(403, 'You can only access students at your school.');
        }
    }
}
