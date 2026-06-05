# Role-Based Access Control (RBAC) Specification

## Overview

The platform implements granular role-based access control using a custom permissions system built on top of Laravel's authorization gates. This supports both system-defined roles (Super Admin, Admin, Dispatcher, Driver, Contractor, Parent, School Contact) and custom organization-specific roles.

---

## Role Hierarchy

```
Super Admin
    |
    +---> Admin
    |       |
    |       +---> Dispatcher
    |       |
    |       +---> School Contact (read-only)
    |
    +---> Driver
    |       |
    |       +---> Contractor (same permissions + earnings view)
    |
    +---> Parent
```

### Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| **Super Admin** | Cross-organization | Full system access. Can create organizations, manage system settings, and impersonate any user. Typically reserved for platform owner/developers. |
| **Admin** | Organization | Full access within their organization. Can manage users, settings, billing, and all operational data. |
| **Dispatcher** | Organization | Daily operations. Routes, runs, assignments, on-demand approvals, notifications, and fleet monitoring. Cannot manage users or organization settings. |
| **Driver** | Self | View own schedule, complete runs, report delays, upload documents. Cannot view other drivers' data. |
| **Contractor** | Self | Same as Driver plus earnings visibility and invoice access. Can view available unassigned runs. |
| **Parent** | Linked children only | Track linked children, receive notifications, view history, submit on-demand requests. Cannot view other families' data. |
| **School Contact** | Assigned school | View routes serving their school, receive delay alerts, view basic fleet status. Read-only access. |

---

## Permission System

### Permission Structure

Each permission consists of:
- **Resource:** The entity being accessed (routes, runs, billing, users, etc.)
- **Action:** The operation being performed (view, create, edit, delete, manage, assign, approve)
- **Scope:** The data boundary (own, organization, all)

### Permission Matrix

| Permission | Super Admin | Admin | Dispatcher | Driver | Contractor | Parent | School |
|------------|:-----------:|:-----:|:----------:|:------:|:----------:|:------:|:------:|
| routes.view | ALL | ORG | ORG | - | - | - | SCH |
| routes.create | ALL | ORG | ORG | - | - | - | - |
| routes.edit | ALL | ORG | ORG | - | - | - | - |
| routes.delete | ALL | ORG | - | - | - | - | - |
| runs.view | ALL | ORG | ORG | OWN | OWN | LINKED | SCH |
| runs.manage | ALL | ORG | ORG | - | - | - | - |
| runs.assign | ALL | ORG | ORG | - | - | - | - |
| runs.complete | ALL | ORG | - | OWN | OWN | - | - |
| billing.view | ALL | ORG | ORG | - | - | - | - |
| billing.manage | ALL | ORG | - | - | - | - | - |
| billing.earnings | ALL | ORG | - | OWN | OWN | - | - |
| invoices.view | ALL | ORG | ORG | - | OWN | - | - |
| reports.view | ALL | ORG | ORG | - | - | - | - |
| users.manage | ALL | ORG | - | - | - | - | - |
| users.view | ALL | ORG | ORG | - | - | - | - |
| fleet.view | ALL | ORG | ORG | - | - | - | SCH |
| contractors.approve | ALL | ORG | - | - | - | - | - |
| ondemand.manage | ALL | ORG | ORG | - | - | - | - |
| ondemand.create | ALL | ORG | ORG | - | - | OWN | - |
| notifications.send | ALL | ORG | ORG | - | - | - | - |
| settings.manage | ALL | ORG | - | - | - | - | - |
| tracking.view | ALL | ORG | ORG | - | - | LINKED | - |

**Legend:**
- ALL = All organizations
- ORG = Own organization only
- SCH = Assigned school only
- OWN = Own records only
- LINKED = Linked children only
- - = No access

---

## Implementation

### Database Tables

Four tables power the RBAC system:

1. **roles** - Defined roles per organization
2. **permissions** - Granular permissions per organization
3. **role_permissions** - Many-to-many link
4. **user_roles** - Many-to-many link (users can have multiple roles)

### Laravel Authorization

```php
// app/Providers/AuthServiceProvider.php
public function boot(): void
{
    Gate::before(function ($user, $ability) {
        // Super admin bypass
        if ($user->hasRole('super_admin')) {
            return true;
        }
    });

    // Dynamic permission gates
    $permissions = Permission::all();
    foreach ($permissions as $permission) {
        Gate::define($permission->slug, function ($user) use ($permission) {
            return $user->hasPermission($permission->slug);
        });
    }
}
```

### Middleware

```php
// routes/api.php
Route::middleware(['auth:api', 'permission:routes.view'])->group(function () {
    Route::get('/routes', [RouteController::class, 'index']);
});

Route::middleware(['auth:api', 'permission:routes.create'])->group(function () {
    Route::post('/routes', [RouteController::class, 'store']);
});

Route::middleware(['auth:api', 'permission:runs.assign'])->group(function () {
    Route::post('/runs/{run}/assign', [RunController::class, 'assign']);
});
```

### Eloquent Trait

```php
trait HasRoles
{
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    public function hasPermission(string $slug): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($q) use ($slug) {
                $q->where('slug', $slug);
            })->exists();
    }

    public function assignRole(Role $role, ?User $assignedBy = null): void
    {
        $this->roles()->attach($role->id, ['assigned_by' => $assignedBy?->id]);
    }
}
```

### Scope-Based Queries

Controllers use scopes to enforce data boundaries:

```php
// Only return data the user is authorized to see
public function index(Request $request)
{
    $query = Route::query();

    // Super admin sees all, others see organization only
    if (!$request->user()->hasRole('super_admin')) {
        $query->where('organization_id', $request->user()->organization_id);
    }

    // School contacts only see routes for their school
    if ($request->user()->hasRole('school_contact')) {
        $schoolId = $request->user()->schoolContact?->school_id;
        $query->where('school_id', $schoolId);
    }

    return $query->paginate();
}
```

---

## Custom Roles

Organizations can create custom roles with any combination of permissions. For example:

- **Senior Dispatcher:** Dispatcher + reports.view + billing.view
- **Part-Time Driver:** Driver with restricted to specific vehicle types
- **Billing Manager:** billing.manage + invoices.view (no route access)

---

## Audit Trail

Role assignments are logged:
- Who assigned the role
- When it was assigned
- Previous role (if changed)

This supports compliance and security reviews.

---

*Version: 1.0 | Last Updated: June 5, 2026*
