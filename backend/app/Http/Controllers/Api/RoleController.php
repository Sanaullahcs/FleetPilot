<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $roles = Role::forOrganization($orgId)
            ->with('permissions:id,name,slug,resource,action')
            ->withCount('users')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $roles]);
    }

    public function permissions(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $permissions = Permission::forOrganization($orgId)
            ->orderBy('resource')
            ->orderBy('action')
            ->get()
            ->groupBy('resource')
            ->map(fn ($group, $resource) => [
                'resource' => $resource,
                'permissions' => $group->values(),
            ])
            ->values();

        return response()->json(['data' => $permissions]);
    }

    public function updatePermissions(Request $request, Role $role): JsonResponse
    {
        $this->authorizeOrg($request, $role);

        $data = $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['uuid', 'exists:permissions,id'],
        ]);

        $role->permissions()->sync($data['permission_ids']);

        return response()->json([
            'data' => $role->fresh()->load('permissions'),
            'message' => 'Permissions updated.',
        ]);
    }

    private function authorizeOrg(Request $request, Role $role): void
    {
        abort_unless($role->organization_id === $request->user()->organization_id, 404);
    }
}
