<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\StoresDriverCredentials;
use App\Models\Driver;
use App\Models\Organization;
use App\Models\ParentAccount;
use App\Models\Permission;
use App\Models\Role;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    use StoresDriverCredentials;
    public function organizations(Request $request): JsonResponse
    {
        $organizations = Organization::query()
            ->select(['id', 'name', 'slug', 'email', 'phone'])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->whereHas('users', fn ($q) => $q->where('role', 'admin')->where('is_active', true))
            ->orderBy('name')
            ->limit(100)
            ->get();

        return response()->json(['data' => $organizations]);
    }

    public function organizationAdmins(Organization $organization): JsonResponse
    {
        $admins = User::query()
            ->where('organization_id', $organization->id)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'role']);

        return response()->json(['data' => $admins]);
    }

    public function organizationSchools(Organization $organization): JsonResponse
    {
        $schools = School::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'city', 'district']);

        return response()->json(['data' => $schools]);
    }

    public function register(Request $request): JsonResponse
    {
        $role = $request->validate([
            'role' => ['required', Rule::in(['admin', 'driver', 'school_contact', 'parent', 'contractor'])],
        ])['role'];

        return match ($role) {
            'admin' => $this->registerAdmin($request),
            'driver' => $this->registerDriver($request),
            'school_contact' => $this->registerSchoolContact($request),
            'parent' => $this->registerParent($request),
            'contractor' => $this->registerContractor($request),
            default => throw ValidationException::withMessages(['role' => ['Invalid registration type.']]),
        };
    }

    private function registerAdmin(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'company_name' => ['required', 'string', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:20'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'address' => ['required', 'string', 'max:500'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:2'],
            'zip' => ['required', 'string', 'max:10'],
        ], $this->accountRules(), $this->passwordRules()));

        $slug = Str::slug($data['company_name']);
        $baseSlug = $slug;
        $i = 1;
        while (Organization::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$i}";
            $i++;
        }

        $organization = Organization::create([
            'name' => $data['company_name'],
            'slug' => $slug,
            'timezone' => $data['timezone'] ?? 'America/New_York',
            'email' => $data['company_email'] ?? $data['email'],
            'phone' => $data['company_phone'] ?? $data['phone'] ?? null,
            'address' => $data['address'],
            'city' => $data['city'],
            'state' => $data['state'],
            'zip' => $data['zip'],
            'settings' => array_filter([
                'website' => $data['website'] ?? null,
            ]),
        ]);

        $this->seedDefaultRoles($organization->id);

        $user = User::create(array_merge(
            $this->userPayload($data, 'admin', true),
            ['organization_id' => $organization->id],
        ));

        return response()->json([
            'message' => 'Organization created successfully. You can sign in now.',
            'data' => [
                'user_id' => $user->id,
                'organization' => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'slug' => $organization->slug,
                ],
            ],
        ], 201);
    }

    private function registerDriver(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'organization_id' => ['required', 'uuid', 'exists:organizations,id'],
            'date_of_birth' => ['nullable', 'date'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'employee_id' => ['nullable', 'string', 'max:50'],
        ], $this->driverCredentialRules(requireLicense: true, requireInsurance: true), $this->addressRules(true), $this->accountRules(), $this->passwordRules()));

        $admin = $this->resolveDefaultOrgAdmin($data['organization_id']);

        $user = User::create(array_merge(
            $this->userPayload($data, 'driver', false),
            [
                'organization_id' => $data['organization_id'],
                'approved_by_user_id' => $admin->id,
            ],
        ));

        $driver = Driver::create(array_merge(
            [
                'organization_id' => $data['organization_id'],
                'user_id' => $user->id,
                'employee_id' => $data['employee_id'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'address' => $this->formatAddress($data),
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
                'status' => 'inactive',
            ],
            $this->extractDriverCredentialFields($data),
        ));

        $this->storeDriverCredentialDocuments($request, $driver, $user->id, true, true);

        $this->attachRoleSlug($user, 'driver');

        return response()->json([
            'message' => 'Registration submitted. Your administrator will review and activate your account.',
            'data' => ['user_id' => $user->id],
        ], 201);
    }

    private function registerSchoolContact(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'organization_id' => ['required', 'uuid', 'exists:organizations,id'],
            'school_name' => ['required', 'string', 'max:255'],
            'school_code' => ['nullable', 'string', 'max:50'],
            'district' => ['nullable', 'string', 'max:255'],
            'grade_levels' => ['nullable', 'string', 'max:50'],
            'estimated_student_count' => ['required', 'integer', 'min:1', 'max:50000'],
            'school_phone' => ['nullable', 'string', 'max:20'],
            'school_website' => ['nullable', 'string', 'max:255'],
            'principal_name' => ['nullable', 'string', 'max:100'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
        ], $this->addressRules(true), $this->accountRules(), $this->passwordRules()));

        $admin = $this->resolveDefaultOrgAdmin($data['organization_id']);

        $school = School::create([
            'organization_id' => $data['organization_id'],
            'name' => $data['school_name'],
            'code' => $data['school_code'] ?? null,
            'district' => $data['district'] ?? null,
            'grade_levels' => $data['grade_levels'] ?? null,
            'address' => $data['address'],
            'city' => $data['city'],
            'state' => $data['state'],
            'zip' => $data['zip'],
            'phone' => $data['school_phone'] ?? $data['phone'] ?? null,
            'contact_name' => trim($data['first_name'].' '.$data['last_name']),
            'contact_email' => $data['email'],
            'contact_phone' => $data['phone'],
            'principal_name' => $data['principal_name'] ?? null,
            'website' => $data['school_website'] ?? null,
        ]);

        $user = User::create(array_merge(
            $this->userPayload($data, 'school_contact', false),
            [
                'organization_id' => $data['organization_id'],
                'approved_by_user_id' => $admin->id,
                'school_id' => $school->id,
                'job_title' => $data['job_title'] ?? null,
                'profile_meta' => array_filter([
                    'department' => $data['department'] ?? null,
                    'estimated_student_count' => $data['estimated_student_count'],
                    'registration_source' => 'signup',
                ]),
            ],
        ));

        return response()->json([
            'message' => 'Registration submitted. Your transportation provider will review and activate your account.',
            'data' => ['user_id' => $user->id, 'school_id' => $school->id],
        ], 201);
    }

    private function registerParent(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'organization_id' => ['required', 'uuid', 'exists:organizations,id'],
            'school_id' => ['required', 'uuid'],
            'relationship' => ['nullable', Rule::in(['mother', 'father', 'guardian', 'grandparent', 'other'])],
            'child_first_name' => ['nullable', 'string', 'max:100'],
            'child_last_name' => ['nullable', 'string', 'max:100'],
            'child_grade' => ['nullable', 'string', 'max:20'],
        ], $this->addressRules(true), $this->accountRules(), $this->passwordRules()));

        $admin = $this->resolveDefaultOrgAdmin($data['organization_id']);
        $this->resolveOrgSchool($data['organization_id'], $data['school_id']);

        $user = User::create(array_merge(
            $this->userPayload($data, 'parent', false),
            [
                'organization_id' => $data['organization_id'],
                'approved_by_user_id' => $admin->id,
                'school_id' => $data['school_id'],
                'profile_meta' => array_filter([
                    'relationship' => $data['relationship'] ?? null,
                    'child_first_name' => $data['child_first_name'] ?? null,
                    'child_last_name' => $data['child_last_name'] ?? null,
                    'child_grade' => $data['child_grade'] ?? null,
                ]),
            ],
        ));

        $this->attachRoleSlug($user, 'parent');

        ParentAccount::create([
            'organization_id' => $data['organization_id'],
            'user_id' => $user->id,
            'relationship' => $data['relationship'] ?? null,
        ]);

        return response()->json([
            'message' => 'Registration submitted. Your administrator will review and activate your account.',
            'data' => ['user_id' => $user->id],
        ], 201);
    }

    private function registerContractor(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge([
            'organization_id' => ['required', 'uuid', 'exists:organizations,id'],
            'company_name' => ['required', 'string', 'max:255'],
            'business_type' => ['nullable', 'string', 'max:100'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'fleet_size' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'driver_count' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'vehicle_count' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'years_in_business' => ['nullable', 'integer', 'min:0', 'max:200'],
            'coverage_areas' => ['nullable', 'string', 'max:2000'],
            'service_radius_miles' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'insurance_carrier' => ['nullable', 'string', 'max:150'],
            'insurance_policy_number' => ['nullable', 'string', 'max:80'],
            'dot_number' => ['nullable', 'string', 'max:50'],
            'mc_number' => ['nullable', 'string', 'max:50'],
        ], $this->addressRules(true), $this->accountRules(), $this->passwordRules()));

        $admin = $this->resolveDefaultOrgAdmin($data['organization_id']);

        $user = User::create(array_merge(
            $this->userPayload($data, 'contractor', false),
            [
                'organization_id' => $data['organization_id'],
                'approved_by_user_id' => $admin->id,
                'job_title' => $data['company_name'],
                'profile_meta' => array_filter([
                    'company_name' => $data['company_name'],
                    'business_type' => $data['business_type'] ?? null,
                    'tax_id' => $data['tax_id'] ?? null,
                    'fleet_size' => $data['fleet_size'] ?? null,
                    'driver_count' => $data['driver_count'] ?? null,
                    'vehicle_count' => $data['vehicle_count'] ?? null,
                    'years_in_business' => $data['years_in_business'] ?? null,
                    'coverage_areas' => $data['coverage_areas'] ?? null,
                    'service_radius_miles' => $data['service_radius_miles'] ?? null,
                    'insurance_carrier' => $data['insurance_carrier'] ?? null,
                    'insurance_policy_number' => $data['insurance_policy_number'] ?? null,
                    'dot_number' => $data['dot_number'] ?? null,
                    'mc_number' => $data['mc_number'] ?? null,
                    'registration_source' => 'signup',
                ]),
            ],
        ));

        $this->attachRoleSlug($user, 'contractor');

        return response()->json([
            'message' => 'Registration submitted. Your transportation provider will review and activate your contractor account, then assign your schools and routes.',
            'data' => ['user_id' => $user->id],
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(array $data, string $role, bool $active): array
    {
        return [
            'email' => $data['email'],
            'password_hash' => $data['password'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'zip' => $data['zip'] ?? null,
            'role' => $role,
            'is_active' => $active,
            'email_verified_at' => $active ? now() : null,
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function accountRules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function passwordRules(): array
    {
        return [
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function addressRules(bool $required = false): array
    {
        $req = $required ? 'required' : 'nullable';

        return [
            'address' => [$req, 'string', 'max:500'],
            'city' => [$req, 'string', 'max:100'],
            'state' => [$req, 'string', 'max:2'],
            'zip' => [$req, 'string', 'max:10'],
        ];
    }

    private function formatAddress(array $data): ?string
    {
        $parts = array_filter([
            $data['address'] ?? null,
            trim(($data['city'] ?? '').', '.($data['state'] ?? '').' '.($data['zip'] ?? '')),
        ]);

        return $parts ? implode(', ', $parts) : null;
    }

    private function resolveDefaultOrgAdmin(string $organizationId): User
    {
        $admin = User::query()
            ->where('organization_id', $organizationId)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN role = 'admin' THEN 0 ELSE 1 END")
            ->orderBy('last_name')
            ->first();

        if (! $admin) {
            throw ValidationException::withMessages([
                'organization_id' => ['This provider has no active administrator to review your request.'],
            ]);
        }

        return $admin;
    }

    private function resolveOrgAdmin(string $organizationId, string $adminUserId): User
    {
        $admin = User::query()
            ->where('id', $adminUserId)
            ->where('organization_id', $organizationId)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->first();

        if (! $admin) {
            throw ValidationException::withMessages([
                'admin_user_id' => ['Selected administrator is not valid for this company.'],
            ]);
        }

        return $admin;
    }

    private function resolveOrgSchool(string $organizationId, string $schoolId): School
    {
        $school = School::query()
            ->where('id', $schoolId)
            ->where('organization_id', $organizationId)
            ->first();

        if (! $school) {
            throw ValidationException::withMessages([
                'school_id' => ['Selected school is not valid for this company.'],
            ]);
        }

        return $school;
    }

    private function attachRoleSlug(User $user, string $slug): void
    {
        $role = Role::query()
            ->where('organization_id', $user->organization_id)
            ->where('slug', $slug)
            ->first();

        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }
    }

    private function seedDefaultRoles(string $orgId): void
    {
        $resources = [
            'students', 'routes', 'runs', 'drivers', 'vehicles',
            'schools', 'stops', 'billing', 'reports', 'users', 'roles', 'settings', 'complaints',
            'contractors',
        ];
        $actions = ['view', 'create', 'update', 'delete'];

        $permissions = [];
        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                $slug = "{$resource}.{$action}";
                $permissions[$slug] = Permission::create([
                    'organization_id' => $orgId,
                    'slug' => $slug,
                    'name' => Str::headline("{$action} {$resource}"),
                    'resource' => $resource,
                    'action' => $action,
                ]);
            }
        }

        $definitions = [
            'admin' => ['name' => 'Administrator', 'permissions' => '*'],
            'dispatcher' => [
                'name' => 'Dispatcher',
                'permissions' => [
                    'students.view', 'students.create', 'students.update',
                    'routes.view', 'routes.create', 'routes.update',
                    'runs.view', 'runs.create', 'runs.update',
                    'drivers.view', 'vehicles.view', 'schools.view',
                    'stops.view', 'stops.create', 'stops.update', 'reports.view',
                ],
            ],
            'driver' => ['name' => 'Driver', 'permissions' => ['runs.view', 'students.view']],
            'parent' => ['name' => 'Parent', 'permissions' => ['students.view']],
            'school_contact' => [
                'name' => 'School Contact',
                'permissions' => [
                    'students.view', 'students.create', 'students.update', 'students.delete',
                    'routes.view', 'runs.view', 'drivers.view', 'vehicles.view', 'schools.view',
                    'complaints.view', 'complaints.create',
                ],
            ],
            'contractor' => [
                'name' => 'Contractor',
                'permissions' => [
                    'routes.view', 'runs.view', 'runs.update',
                    'drivers.view', 'drivers.create', 'drivers.update',
                    'vehicles.view', 'vehicles.create', 'vehicles.update',
                    'schools.view', 'students.view', 'complaints.view', 'complaints.create',
                ],
            ],
        ];

        foreach ($definitions as $slug => $def) {
            $role = Role::create([
                'organization_id' => $orgId,
                'slug' => $slug,
                'name' => $def['name'],
                'is_system_role' => true,
            ]);

            $grant = $def['permissions'] === '*'
                ? collect($permissions)->pluck('id')
                : collect($def['permissions'])->map(fn ($s) => $permissions[$s]->id ?? null)->filter();

            $role->permissions()->sync($grant->all());
        }
    }
}
