<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Organization;
use App\Models\ParentAccount;
use App\Models\ParentStudent;
use App\Models\Route;
use App\Models\Run;
use App\Models\RunAssignment;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Models\Stop;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::where('slug', 'metro-k12')->first();
        if (! $org) {
            return;
        }

        $schools = $this->seedSchools($org->id);
        $this->seedVehicles($org->id);
        $this->seedDrivers($org->id);
        $this->seedStudents($org->id, $schools);
        $this->seedAssignments($org->id);
        $this->seedRoutes($org->id, $schools);
        $this->seedRunAssignments($org->id);
        $this->seedParentLinks($org->id);
        $this->linkMobileDemoUsers($org->id);
        $this->seedStopsAndRunStops($org->id, $schools);
        $this->seedStudentStopAssignments($org->id);
    }

    /**
     * @return array<int, \App\Models\School>
     */
    private function seedSchools(string $orgId): array
    {
        $data = [
            [
                'name' => 'Lincoln Elementary School',
                'code' => 'LES',
                'district' => 'Metro K-12 District',
                'grade_levels' => 'K–5',
                'address' => '1200 N Grand Ave',
                'city' => 'Springfield',
                'lat' => 39.7990,
                'lng' => -89.6540,
                'principal' => 'Dr. Sarah Mitchell',
                'website' => 'https://les.metro-k12.example.com',
            ],
            [
                'name' => 'Roosevelt Middle School',
                'code' => 'RMS',
                'district' => 'Metro K-12 District',
                'grade_levels' => '6–8',
                'address' => '800 S 5th St',
                'city' => 'Springfield',
                'lat' => 39.7820,
                'lng' => -89.6440,
                'principal' => 'James Patterson',
                'website' => 'https://rms.metro-k12.example.com',
            ],
            [
                'name' => 'Washington High School',
                'code' => 'WHS',
                'district' => 'Metro K-12 District',
                'grade_levels' => '9–12',
                'address' => '2100 E Jackson St',
                'city' => 'Springfield',
                'lat' => 39.8010,
                'lng' => -89.6210,
                'principal' => 'Dr. Angela Brooks',
                'website' => 'https://whs.metro-k12.example.com',
            ],
        ];

        $schools = [];
        foreach ($data as $row) {
            $schools[] = School::updateOrCreate(
                ['organization_id' => $orgId, 'code' => $row['code']],
                [
                    'name' => $row['name'],
                    'district' => $row['district'],
                    'grade_levels' => $row['grade_levels'],
                    'address' => $row['address'],
                    'city' => $row['city'],
                    'state' => 'IL',
                    'zip' => '62701',
                    'timezone' => 'America/Chicago',
                    'phone' => '(555) 200-' . substr($row['code'], 0, 1) . random_int(100, 999),
                    'contact_name' => 'Transportation Liaison',
                    'contact_email' => strtolower($row['code']) . '@metro-k12.example.com',
                    'contact_phone' => '(555) 200-' . random_int(5000, 5999),
                    'principal_name' => $row['principal'],
                    'website' => $row['website'],
                    'latitude' => $row['lat'],
                    'longitude' => $row['lng'],
                    'bell_times' => ['am_bell' => '08:15', 'pm_dismissal' => '15:10', 'early_release' => '13:30'],
                ],
            );
        }

        return $schools;
    }

    private function seedVehicles(string $orgId): void
    {
        $vehicles = [
            ['n' => 'BUS-101', 'type' => 'bus', 'cap' => 48, 'make' => 'Blue Bird', 'model' => 'Vision'],
            ['n' => 'BUS-102', 'type' => 'bus', 'cap' => 48, 'make' => 'Thomas', 'model' => 'C2'],
            ['n' => 'BUS-103', 'type' => 'bus', 'cap' => 72, 'make' => 'IC Bus', 'model' => 'CE'],
            ['n' => 'VAN-201', 'type' => 'wheelchair_van', 'cap' => 8, 'wc' => 2, 'make' => 'Ford', 'model' => 'Transit'],
            ['n' => 'VAN-202', 'type' => 'van', 'cap' => 12, 'make' => 'Chevrolet', 'model' => 'Express'],
            ['n' => 'SED-301', 'type' => 'sedan', 'cap' => 4, 'make' => 'Toyota', 'model' => 'Camry'],
        ];

        foreach ($vehicles as $v) {
            Vehicle::firstOrCreate(
                ['organization_id' => $orgId, 'vehicle_number' => $v['n']],
                [
                    'type' => $v['type'],
                    'capacity' => $v['cap'],
                    'wheelchair_capacity' => $v['wc'] ?? 0,
                    'make' => $v['make'],
                    'model' => $v['model'],
                    'year' => random_int(2017, 2024),
                    'license_plate' => 'IL-' . random_int(10000, 99999),
                    'status' => 'active',
                    'fuel_type' => 'diesel',
                    'current_odometer' => random_int(20000, 120000),
                    'cost_per_mile' => 1.85,
                ],
            );
        }
    }

    private function seedDrivers(string $orgId): void
    {
        $names = [
            ['Marcus', 'Johnson'], ['Elena', 'Rodriguez'], ['David', 'Chen'],
            ['Aisha', 'Williams'], ['Robert', 'Miller'], ['Sophia', 'Martinez'],
        ];

        foreach ($names as $i => [$first, $last]) {
            Driver::firstOrCreate(
                ['organization_id' => $orgId, 'employee_id' => 'EMP-' . (1001 + $i)],
                [
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => strtolower("$first.$last") . '@metro-k12.example.com',
                    'phone' => '(555) 300-' . random_int(1000, 9999),
                    'license_number' => 'DL' . random_int(1000000, 9999999),
                    'license_class' => 'CDL-B',
                    'license_state' => 'IL',
                    'license_expiry' => now()->addMonths(random_int(3, 30))->toDateString(),
                    'hire_date' => now()->subMonths(random_int(6, 60))->toDateString(),
                    'status' => 'active',
                ],
            );
        }
    }

    /**
     * @param  array<int, \App\Models\School>  $schools
     */
    private function seedStudents(string $orgId, array $schools): void
    {
        $first = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Sophia', 'James', 'Isabella', 'Lucas', 'Mia', 'Mason', 'Amelia', 'Ethan', 'Harper', 'Logan', 'Evelyn', 'Jacob', 'Abigail'];
        $last = ['Smith', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Lee', 'Clark'];

        foreach ($first as $i => $fname) {
            $school = $schools[$i % count($schools)];
            Student::firstOrCreate(
                ['organization_id' => $orgId, 'student_number' => 'STU-' . (5001 + $i)],
                [
                    'first_name' => $fname,
                    'last_name' => $last[$i % count($last)],
                    'grade' => (string) random_int(1, 12),
                    'school_id' => $school->id,
                    'home_address' => random_int(100, 999) . ' Maple St, Springfield, IL',
                    'home_latitude' => 39.78 + (random_int(-200, 200) / 10000),
                    'home_longitude' => -89.64 + (random_int(-200, 200) / 10000),
                    'has_iep' => $i % 7 === 0,
                    'requires_wheelchair' => $i % 11 === 0,
                    'requires_aide' => $i % 9 === 0,
                    'status' => 'active',
                    'emergency_contact_name' => 'Parent / Guardian',
                    'emergency_contact_phone' => '(555) 400-' . random_int(1000, 9999),
                ],
            );
        }
    }

    /**
     * @param  array<int, \App\Models\School>  $schools
     */
    private function seedAssignments(string $orgId): void
    {
        $drivers = Driver::where('organization_id', $orgId)->orderBy('employee_id')->get();
        $vehicles = Vehicle::where('organization_id', $orgId)->orderBy('vehicle_number')->get();
        $students = Student::where('organization_id', $orgId)->orderBy('student_number')->get();

        foreach ($drivers->values() as $i => $driver) {
            if ($vehicle = $vehicles->get($i)) {
                $driver->update(['default_vehicle_id' => $vehicle->id]);
            }
        }

        foreach ($students->values() as $i => $student) {
            if ($drivers->isEmpty()) {
                break;
            }
            $driver = $drivers->get($i % $drivers->count());
            $student->update(['assigned_driver_id' => $driver->id]);
        }
    }

    /**
     * @param  array<int, \App\Models\School>  $schools
     */
    private function seedRoutes(string $orgId, array $schools): void
    {
        foreach ($schools as $i => $school) {
            foreach (['am', 'pm'] as $type) {
                $route = Route::firstOrCreate(
                    ['organization_id' => $orgId, 'code' => "{$school->code}-{$type}"],
                    [
                        'name' => "{$school->name} — " . strtoupper($type) . ' Route',
                        'school_id' => $school->id,
                        'type' => $type,
                        'days_of_week' => [1, 2, 3, 4, 5],
                        'status' => 'active',
                        'description' => 'Daily ' . strtoupper($type) . ' service for ' . $school->name,
                    ],
                );

                Run::firstOrCreate(
                    ['route_id' => $route->id, 'name' => "{$school->code} {$type} Run 1"],
                    [
                        'scheduled_start_time' => $type === 'am' ? '07:00:00' : '15:15:00',
                        'scheduled_end_time' => $type === 'am' ? '08:10:00' : '16:30:00',
                        'direction' => $type === 'am' ? 'to_school' : 'from_school',
                        'estimated_distance_miles' => random_int(8, 24),
                        'estimated_duration_minutes' => random_int(35, 75),
                        'status' => 'active',
                        'effective_date' => now()->startOfMonth()->toDateString(),
                    ],
                );
            }
        }
    }

    private function seedRunAssignments(string $orgId): void
    {
        $drivers = Driver::where('organization_id', $orgId)->orderBy('employee_id')->get();
        $vehicles = Vehicle::where('organization_id', $orgId)->orderBy('vehicle_number')->get();
        $runs = Run::whereHas('route', fn ($q) => $q->where('organization_id', $orgId))
            ->where('status', 'active')
            ->with('route')
            ->orderBy('name')
            ->get();

        if ($runs->isEmpty()) {
            return;
        }

        foreach ($drivers->values() as $i => $driver) {
            $vehicle = $vehicles->get($i);
            $run = $runs->get($i % $runs->count());
            if (! $run || ! $vehicle) {
                continue;
            }

            RunAssignment::updateOrCreate(
                [
                    'run_id' => $run->id,
                    'service_date' => now()->toDateString(),
                ],
                [
                    'driver_id' => $driver->id,
                    'vehicle_id' => $vehicle->id,
                    'status' => $i % 3 === 0 ? 'in_progress' : 'scheduled',
                ],
            );
        }
    }

    private function seedParentLinks(string $orgId): void
    {
        $parentUser = User::where('email', 'parent@fleetpilot.test')->first();
        if (! $parentUser) {
            return;
        }

        $account = ParentAccount::firstOrCreate(
            ['user_id' => $parentUser->id],
            ['organization_id' => $orgId, 'relationship' => 'guardian'],
        );

        $parentUser->update([
            'phone' => $parentUser->phone ?: '(555) 302-2000',
        ]);

        $students = Student::where('organization_id', $orgId)
            ->orderBy('student_number')
            ->limit(2)
            ->get();

        foreach ($students->values() as $i => $student) {
            ParentStudent::firstOrCreate(
                [
                    'parent_account_id' => $account->id,
                    'student_id' => $student->id,
                ],
                [
                    'relationship' => 'guardian',
                    'is_primary' => $i === 0,
                    'can_pickup' => true,
                ],
            );
        }
    }

    private function linkMobileDemoUsers(string $orgId): void
    {
        $driverUser = User::where('email', 'driver@fleetpilot.test')->first();
        if (! $driverUser) {
            return;
        }

        $vehicle = Vehicle::where('organization_id', $orgId)->orderBy('vehicle_number')->first();
        $run = Run::whereHas('route', fn ($q) => $q->where('organization_id', $orgId))
            ->where('status', 'active')
            ->orderBy('name')
            ->first();

        $driver = Driver::updateOrCreate(
            ['organization_id' => $orgId, 'employee_id' => 'EMP-1000'],
            [
                'user_id' => $driverUser->id,
                'first_name' => 'Drew',
                'last_name' => 'Driver',
                'email' => $driverUser->email,
                'phone' => '(555) 301-1000',
                'license_number' => 'DL9001001',
                'license_class' => 'CDL-B',
                'license_state' => 'IL',
                'license_expiry' => now()->addMonths(14)->toDateString(),
                'medical_cert_expiry' => now()->addMonths(10)->toDateString(),
                'hire_date' => now()->subYears(3)->toDateString(),
                'status' => 'active',
                'default_vehicle_id' => $vehicle?->id,
            ],
        );

        if ($run && $vehicle) {
            RunAssignment::updateOrCreate(
                [
                    'run_id' => $run->id,
                    'service_date' => now()->toDateString(),
                ],
                [
                    'driver_id' => $driver->id,
                    'vehicle_id' => $vehicle->id,
                    'status' => 'scheduled',
                ],
            );
        }
    }

    /**
     * @param  array<int, \App\Models\School>  $schools
     */
    private function seedStopsAndRunStops(string $orgId, array $schools): void
    {
        $runs = Run::whereHas('route', fn ($q) => $q->where('organization_id', $orgId))
            ->where('status', 'active')
            ->with('route.school')
            ->get();

        foreach ($runs as $run) {
            $school = $run->route?->school;
            if (! $school) {
                continue;
            }

            $stopNames = ['Oak Ridge & 5th', 'Maple Park', 'Cedar Lane', 'Elm Street', $school->name];
            $sequence = 1;

            foreach ($stopNames as $i => $name) {
                $stop = Stop::firstOrCreate(
                    ['organization_id' => $orgId, 'code' => strtoupper(substr(preg_replace('/\W/', '', $name), 0, 8)) . "-{$run->id}-{$i}"],
                    [
                        'name' => $name,
                        'address' => $i === count($stopNames) - 1 ? $school->address : random_int(100, 999) . ' Main St',
                        'city' => $school->city ?? 'Springfield',
                        'state' => 'IL',
                        'zip' => '62701',
                        'latitude' => (float) ($school->latitude ?? 39.78) + (($i - 2) * 0.004),
                        'longitude' => (float) ($school->longitude ?? -89.64) + (($i - 2) * 0.003),
                        'type' => $i === count($stopNames) - 1 ? 'school' : 'student',
                        'school_id' => $i === count($stopNames) - 1 ? $school->id : null,
                    ],
                );

                $existing = DB::table('run_stops')
                    ->where('run_id', $run->id)
                    ->where('sequence', $sequence)
                    ->first();

                if ($existing) {
                    DB::table('run_stops')->where('id', $existing->id)->update([
                        'stop_id' => $stop->id,
                        'scheduled_time' => $run->scheduled_start_time,
                        'estimated_arrival' => $run->scheduled_start_time,
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('run_stops')->insert([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'run_id' => $run->id,
                        'stop_id' => $stop->id,
                        'sequence' => $sequence,
                        'scheduled_time' => $run->scheduled_start_time,
                        'estimated_arrival' => $run->scheduled_start_time,
                        'distance_from_previous_miles' => $sequence === 1 ? 0 : 0.8,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $sequence++;
            }
        }
    }

    private function seedStudentStopAssignments(string $orgId): void
    {
        $runs = Run::whereHas('route', fn ($q) => $q->where('organization_id', $orgId))
            ->where('status', 'active')
            ->with('route')
            ->get();

        foreach ($runs as $run) {
            $pickupStops = DB::table('run_stops')
                ->join('stops', 'stops.id', '=', 'run_stops.stop_id')
                ->where('run_stops.run_id', $run->id)
                ->where('stops.type', 'student')
                ->orderBy('run_stops.sequence')
                ->get(['run_stops.stop_id']);

            if ($pickupStops->isEmpty()) {
                continue;
            }

            $students = Student::query()
                ->where('organization_id', $orgId)
                ->where('school_id', $run->route?->school_id)
                ->where('status', 'active')
                ->orderBy('student_number')
                ->limit($pickupStops->count())
                ->get();

            foreach ($pickupStops->values() as $i => $stopRow) {
                $student = $students->get($i);
                if (! $student) {
                    continue;
                }

                $exists = DB::table('student_stop_assignments')
                    ->where('student_id', $student->id)
                    ->where('run_id', $run->id)
                    ->exists();

                if ($exists) {
                    DB::table('student_stop_assignments')
                        ->where('student_id', $student->id)
                        ->where('run_id', $run->id)
                        ->update([
                            'stop_id' => $stopRow->stop_id,
                            'type' => 'pickup',
                            'status' => 'active',
                            'updated_at' => now(),
                        ]);
                } else {
                    DB::table('student_stop_assignments')->insert([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'student_id' => $student->id,
                        'run_id' => $run->id,
                        'stop_id' => $stopRow->stop_id,
                        'type' => 'pickup',
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
