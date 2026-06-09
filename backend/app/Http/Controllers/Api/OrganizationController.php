<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class OrganizationController extends Controller
{
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $organizations = Organization::query()
            ->withCount([
                'users',
                'users as admins_count' => fn ($q) => $q->where('role', 'admin'),
            ])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            });

        $this->applyListSort($organizations, $request, [
            'slug', 'name', 'email',
        ], 'name');

        $organizations = $organizations->paginate($request->integer('per_page', 15));

        return response()->json($organizations);
    }

    public function show(Organization $organization): JsonResponse
    {
        $organization->loadCount([
            'users',
            'users as admins_count' => fn ($q) => $q->where('role', 'admin'),
        ]);

        $admins = User::where('organization_id', $organization->id)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->orderBy('last_name')
            ->get(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login_at']);

        return response()->json([
            'data' => $organization,
            'admins' => $admins,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:organizations,slug'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'admin_email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'admin_first_name' => ['nullable', 'string', 'max:100'],
            'admin_last_name' => ['nullable', 'string', 'max:100'],
            'admin_password' => ['nullable', 'confirmed', Password::min(8)],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);
        $baseSlug = $slug;
        $i = 1;
        while (Organization::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$i}";
            $i++;
        }

        $organization = Organization::create([
            'name' => $data['name'],
            'slug' => $slug,
            'timezone' => $data['timezone'] ?? 'America/New_York',
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
        ]);

        $admin = null;
        if (! empty($data['admin_email'])) {
            $admin = User::create([
                'organization_id' => $organization->id,
                'email' => $data['admin_email'],
                'password_hash' => $data['admin_password'] ?? 'password',
                'first_name' => $data['admin_first_name'] ?? 'Org',
                'last_name' => $data['admin_last_name'] ?? 'Admin',
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }

        return response()->json([
            'data' => $organization->loadCount('users'),
            'admin' => $admin,
        ], 201);
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:100', Rule::unique('organizations', 'slug')->ignore($organization->id)],
            'timezone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $organization->update($data);

        return response()->json(['data' => $organization->fresh()]);
    }

    public function destroy(Organization $organization): JsonResponse
    {
        if ($organization->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete an organization that still has users. Remove users first.',
            ], 422);
        }

        $organization->delete();

        return response()->json(['message' => 'Organization deleted.']);
    }
}
