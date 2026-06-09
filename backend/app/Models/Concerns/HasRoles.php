<?php

namespace App\Models\Concerns;

use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

trait HasRoles
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    /**
     * The user's "primary" role is stored on the users.role column, while
     * granular RBAC roles live in the user_roles pivot. We treat both.
     */
    public function hasRole(string $slug): bool
    {
        if ($this->role === $slug) {
            return true;
        }

        return $this->roles->contains('slug', $slug);
    }

    /**
     * @param  array<int, string>  $slugs
     */
    public function hasAnyRole(array $slugs): bool
    {
        foreach ($slugs as $slug) {
            if ($this->hasRole($slug)) {
                return true;
            }
        }

        return false;
    }

    public function hasPermission(string $slug): bool
    {
        // Platform and org admins implicitly hold every permission.
        if ($this->role === 'admin' || $this->role === 'super_admin') {
            return true;
        }

        return $this->allPermissions()->contains('slug', $slug);
    }

    /**
     * @return Collection<int, \App\Models\Permission>
     */
    public function allPermissions(): Collection
    {
        return $this->roles
            ->loadMissing('permissions')
            ->flatMap(fn (Role $role) => $role->permissions)
            ->unique('id')
            ->values();
    }
}
