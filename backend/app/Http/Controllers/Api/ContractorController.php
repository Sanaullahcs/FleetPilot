<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\ContractorAssignment;
use App\Models\Role;
use App\Models\Route;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Admin-facing management of contractors and the schools/routes delegated to
 * them. Only organization admins reach these endpoints (RBAC contractors.*).
 */
class ContractorController extends Controller
{
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $query = User::query()
            ->where('organization_id', $orgId)
            ->where('role', 'contractor')
            ->withCount([
                'contractorAssignments',
                'contractorAssignments as schools_count' => fn ($q) => $q->whereNotNull('school_id'),
                'contractorAssignments as routes_count' => fn ($q) => $q->whereNotNull('route_id'),
                'ownedDrivers',
                'ownedVehicles',
            ])
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')));

        $this->applyListSort($query, $request, [
            'first_name', 'last_name', 'email', 'is_active', 'created_at',
        ], 'last_name');

        return response()->json($query->paginate($request->integer('per_page', 15)));
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $base = User::query()->where('organization_id', $orgId)->where('role', 'contractor');

        $total = (clone $base)->count();
        $active = (clone $base)->where('is_active', true)->count();
        $pending = (clone $base)->where('is_active', false)->count();
        $assignedSchools = ContractorAssignment::where('organization_id', $orgId)->whereNotNull('school_id')->distinct()->count('school_id');
        $assignedRoutes = ContractorAssignment::where('organization_id', $orgId)->whereNotNull('route_id')->distinct()->count('route_id');

        return response()->json([
            'data' => [
                'total' => $total,
                'active' => $active,
                'pending' => $pending,
                'assigned_schools' => $assignedSchools,
                'assigned_routes' => $assignedRoutes,
            ],
        ]);
    }

    public function show(Request $request, User $contractor): JsonResponse
    {
        $this->authorizeContractor($request, $contractor);

        $contractor->load([
            'contractorAssignments.school:id,name,code,city',
            'contractorAssignments.route:id,name,code,school_id',
            'contractorAssignments.route.school:id,name,code',
            'contractorAssignments.assignedBy:id,first_name,last_name',
        ])->loadCount(['ownedDrivers', 'ownedVehicles']);

        return response()->json(['data' => $contractor]);
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'company_name' => ['nullable', 'string', 'max:255'],
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
            'password' => ['required', 'confirmed', Password::min(8)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $contractor = User::create([
            'organization_id' => $orgId,
            'approved_by_user_id' => $request->user()->id,
            'email' => $data['email'],
            'password_hash' => $data['password'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
            'job_title' => $data['company_name'] ?? null,
            'role' => 'contractor',
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => now(),
            'profile_meta' => array_filter([
                'company_name' => $data['company_name'] ?? null,
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
                'created_by' => 'admin',
            ]),
        ]);

        $this->attachContractorRole($contractor);

        return response()->json([
            'data' => $contractor->loadCount(['contractorAssignments', 'ownedDrivers', 'ownedVehicles']),
            'message' => 'Contractor created.',
        ], 201);
    }

    public function update(Request $request, User $contractor): JsonResponse
    {
        $this->authorizeContractor($request, $contractor);

        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $update = array_filter([
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
        ], fn ($v) => $v !== null);

        if (array_key_exists('phone', $data)) {
            $update['phone'] = $data['phone'];
        }
        if (array_key_exists('company_name', $data)) {
            $update['job_title'] = $data['company_name'];
        }
        if (array_key_exists('is_active', $data)) {
            $update['is_active'] = $data['is_active'];
        }

        $contractor->update($update);
        $this->attachContractorRole($contractor);

        return response()->json([
            'data' => $contractor->fresh()->loadCount(['contractorAssignments', 'ownedDrivers', 'ownedVehicles']),
            'message' => 'Contractor updated.',
        ]);
    }

    public function destroy(Request $request, User $contractor): JsonResponse
    {
        $this->authorizeContractor($request, $contractor);

        $contractor->delete();

        return response()->json(['message' => 'Contractor removed.']);
    }

    /**
     * Schools and routes in the org with a flag for what this contractor holds.
     */
    public function options(Request $request, User $contractor): JsonResponse
    {
        $this->authorizeContractor($request, $contractor);
        $orgId = $request->user()->organization_id;

        $assignedSchoolIds = $contractor->contractorAssignments()->whereNotNull('school_id')->pluck('school_id')->all();
        $assignedRouteIds = $contractor->contractorAssignments()->whereNotNull('route_id')->pluck('route_id')->all();

        $schools = School::forOrganization($orgId)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'city'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'city' => $s->city,
                'assigned' => in_array($s->id, $assignedSchoolIds, true),
            ]);

        $routes = Route::forOrganization($orgId)
            ->with('school:id,name,code')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'type', 'school_id'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'code' => $r->code,
                'type' => $r->type,
                'school' => $r->school ? ['id' => $r->school->id, 'name' => $r->school->name, 'code' => $r->school->code] : null,
                'assigned' => in_array($r->id, $assignedRouteIds, true),
            ]);

        return response()->json(['data' => ['schools' => $schools, 'routes' => $routes]]);
    }

    public function assign(Request $request, User $contractor): JsonResponse
    {
        $this->authorizeContractor($request, $contractor);
        $orgId = $request->user()->organization_id;

        $data = $request->validate([
            'type' => ['required', 'in:school,route'],
            'school_id' => ['required_if:type,school', 'uuid'],
            'route_id' => ['required_if:type,route', 'uuid'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['type'] === 'school') {
            $school = School::forOrganization($orgId)->find($data['school_id']);
            if (! $school) {
                throw ValidationException::withMessages(['school_id' => 'School not found in your organization.']);
            }

            $assignment = ContractorAssignment::firstOrCreate(
                ['contractor_id' => $contractor->id, 'school_id' => $school->id, 'route_id' => null],
                ['organization_id' => $orgId, 'assigned_by' => $request->user()->id, 'notes' => $data['notes'] ?? null],
            );
        } else {
            $route = Route::forOrganization($orgId)->find($data['route_id']);
            if (! $route) {
                throw ValidationException::withMessages(['route_id' => 'Route not found in your organization.']);
            }

            $assignment = ContractorAssignment::firstOrCreate(
                ['contractor_id' => $contractor->id, 'route_id' => $route->id, 'school_id' => null],
                ['organization_id' => $orgId, 'assigned_by' => $request->user()->id, 'notes' => $data['notes'] ?? null],
            );
        }

        $assignment->load([
            'school:id,name,code',
            'route:id,name,code,school_id',
            'route.school:id,name,code',
        ]);

        return response()->json(['data' => $assignment, 'message' => 'Assignment added.'], 201);
    }

    public function removeAssignment(Request $request, ContractorAssignment $assignment): JsonResponse
    {
        abort_unless($assignment->organization_id === $request->user()->organization_id, 404);

        $assignment->delete();

        return response()->json(['message' => 'Assignment removed.']);
    }

    private function authorizeContractor(Request $request, User $contractor): void
    {
        abort_unless(
            $contractor->organization_id === $request->user()->organization_id
            && $contractor->role === 'contractor',
            404,
        );
    }

    private function attachContractorRole(User $contractor): void
    {
        $role = Role::query()
            ->where('organization_id', $contractor->organization_id)
            ->where('slug', 'contractor')
            ->first();

        if ($role) {
            $contractor->roles()->syncWithoutDetaching([$role->id]);
        }
    }
}
