<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $isSuperAdmin = $actor->role === 'super_admin';

        $query = User::query()
            ->with(['roles:id,name,slug', 'organization:id,name,slug'])
            ->when(! $isSuperAdmin, fn ($q) => $q->where('organization_id', $actor->organization_id))
            ->when($isSuperAdmin && $request->string('organization_id')->toString(), function ($q, $orgId) {
                $q->where('organization_id', $orgId);
            })
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('email', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($request->string('role')->toString(), fn ($q, $role) => $q->where('role', $role))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')));

        $this->applyListSort($query, $request, [
            'email', 'first_name', 'last_name', 'role', 'last_login_at',
        ], 'last_name');

        $users = $query->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeOrg($request, $user);

        return response()->json([
            'data' => $user->load('roles.permissions', 'organization:id,name'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();
        $data = $this->validateData($request, true);
        $data['organization_id'] = $actor->role === 'super_admin'
            ? ($data['organization_id'] ?? null)
            : $actor->organization_id;

        if ($actor->role !== 'super_admin' && empty($data['organization_id'])) {
            return response()->json(['message' => 'Organization is required.'], 422);
        }

        if ($actor->role === 'super_admin' && ($data['role'] ?? 'admin') !== 'admin' && ($data['role'] ?? '') !== 'dispatcher') {
            // Super admin primarily provisions org admins/dispatchers.
        }

        $data['password_hash'] = $data['password'];
        unset($data['password']);
        $roleIds = $data['role_ids'] ?? [];
        unset($data['role_ids']);

        $user = User::create($data);

        if ($roleIds) {
            $user->roles()->sync($roleIds);
        }

        return response()->json(['data' => $user->load(['roles', 'organization:id,name'])], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeOrg($request, $user);

        $data = $this->validateData($request, false, $user);
        if (isset($data['password'])) {
            $data['password_hash'] = $data['password'];
            unset($data['password']);
        }

        $roleIds = $data['role_ids'] ?? null;
        unset($data['role_ids']);

        if ($request->user()->role !== 'super_admin') {
            unset($data['organization_id']);
        }

        $user->update($data);

        if ($roleIds !== null) {
            $user->roles()->sync($roleIds);
        }

        return response()->json(['data' => $user->fresh()->load(['roles', 'organization:id,name'])]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->authorizeOrg($request, $user);

        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user->update(['password_hash' => $request->password]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $this->authorizeOrg($request, $user);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot block your own account.'], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return response()->json([
            'data' => $user->fresh(),
            'message' => $user->is_active ? 'User activated.' : 'User blocked.',
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeOrg($request, $user);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request, bool $creating, ?User $user = null): array
    {
        $roles = ['admin', 'dispatcher', 'driver', 'contractor', 'school_contact', 'parent'];

        return $request->validate([
            'email' => [
                $creating ? 'required' : 'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => [$creating ? 'required' : 'nullable', 'confirmed', Password::min(8)],
            'first_name' => [$creating ? 'required' : 'sometimes', 'string', 'max:100'],
            'last_name' => [$creating ? 'required' : 'sometimes', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['sometimes', Rule::in($roles)],
            'organization_id' => ['nullable', 'uuid', 'exists:organizations,id'],
            'is_active' => ['sometimes', 'boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['uuid', 'exists:roles,id'],
        ]);
    }

    private function authorizeOrg(Request $request, User $user): void
    {
        if ($request->user()->role === 'super_admin') {
            return;
        }

        abort_unless($user->organization_id === $request->user()->organization_id, 404);
    }
}
