<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\DemoCredentials;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::firstOrCreate(
            ['slug' => 'metro-k12'],
            [
                'name' => 'Metro K-12 Transportation',
                'timezone' => 'America/New_York',
                'email' => 'dispatch@metro-k12.example.com',
                'phone' => '(555) 010-1000',
            ],
        );

        $permissions = $this->seedPermissions($org->id);
        $roles = $this->seedRoles($org->id, $permissions);
        $this->seedUsers($org->id, $roles);

        User::updateOrCreate(
            ['email' => 'super@fleetpilot.test'],
            [
                'organization_id' => null,
                'password_hash' => DemoCredentials::PASSWORD,
                'first_name' => 'Sam',
                'last_name' => 'SuperAdmin',
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $this->call(DemoDataSeeder::class);
    }

    /**
     * @return array<string, \App\Models\Permission>
     */
    private function seedPermissions(string $orgId): array
    {
        $resources = [
            'students', 'routes', 'runs', 'drivers', 'vehicles',
            'schools', 'stops', 'billing', 'reports', 'users', 'roles', 'settings', 'complaints',
        ];
        $actions = ['view', 'create', 'update', 'delete'];

        $permissions = [];
        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                $slug = "{$resource}.{$action}";
                $permissions[$slug] = Permission::firstOrCreate(
                    ['organization_id' => $orgId, 'slug' => $slug],
                    [
                        'name' => Str::headline("{$action} {$resource}"),
                        'resource' => $resource,
                        'action' => $action,
                    ],
                );
            }
        }

        return $permissions;
    }

    /**
     * @param  array<string, \App\Models\Permission>  $permissions
     * @return array<string, \App\Models\Role>
     */
    private function seedRoles(string $orgId, array $permissions): array
    {
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
                    'complaints.view', 'complaints.create', 'complaints.update',
                ],
            ],
            'driver' => ['name' => 'Driver', 'permissions' => ['runs.view', 'students.view']],
            'parent' => ['name' => 'Parent', 'permissions' => ['students.view']],
            'school_contact' => [
                'name' => 'School Contact',
                'permissions' => [
                    'students.view',
                    'students.create',
                    'students.update',
                    'students.delete',
                    'routes.view',
                    'runs.view',
                    'drivers.view',
                    'vehicles.view',
                    'schools.view',
                    'complaints.view',
                    'complaints.create',
                ],
            ],
        ];

        $roles = [];
        foreach ($definitions as $slug => $def) {
            $role = Role::firstOrCreate(
                ['organization_id' => $orgId, 'slug' => $slug],
                ['name' => $def['name'], 'is_system_role' => true],
            );

            $grant = $def['permissions'] === '*'
                ? collect($permissions)->pluck('id')
                : collect($def['permissions'])->map(fn ($s) => $permissions[$s]->id ?? null)->filter();

            $role->permissions()->syncWithoutDetaching($grant->all());
            $roles[$slug] = $role;
        }

        return $roles;
    }

    /**
     * @param  array<string, \App\Models\Role>  $roles
     */
    private function seedUsers(string $orgId, array $roles): void
    {
        $users = [
            ['email' => 'admin@fleetpilot.test', 'first_name' => 'Avery', 'last_name' => 'Admin', 'role' => 'admin'],
            ['email' => 'dispatch@fleetpilot.test', 'first_name' => 'Dana', 'last_name' => 'Dispatcher', 'role' => 'dispatcher'],
            ['email' => 'driver@fleetpilot.test', 'first_name' => 'Drew', 'last_name' => 'Driver', 'role' => 'driver'],
            ['email' => 'parent@fleetpilot.test', 'first_name' => 'Pat', 'last_name' => 'Parent', 'role' => 'parent'],
        ];

        foreach ($users as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'organization_id' => $orgId,
                    'password_hash' => DemoCredentials::PASSWORD,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'role' => $data['role'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );

            if (isset($roles[$data['role']])) {
                $user->roles()->syncWithoutDetaching([$roles[$data['role']]->id]);
            }
        }
    }
}
