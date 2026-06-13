<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Http\Controllers\Concerns\StoresDriverCredentials;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DriverController extends Controller
{
    use ResolvesAccessScope;
    use SortsQueries;
    use StoresDriverCredentials;

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $schoolId = $this->schoolScopeId($request->user());

        $drivers = Driver::forOrganization($orgId);
        $drivers = $this->applySchoolDriverScope($request->user(), $drivers);
        $drivers = $this->applyContractorOwnedScope($request->user(), $drivers);
        $drivers = $drivers
            ->with('defaultVehicle:id,vehicle_number,type,status')
            ->when(
                $schoolId,
                fn ($q) => $q->withCount(['students as students_count' => fn ($s) => $s->where('school_id', $schoolId)]),
                fn ($q) => $q->withCount('students'),
            )
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('license_class')->toString(), fn ($q, $cls) => $q->where('license_class', $cls))
            ->when($request->string('vehicle_assignment')->toString() === 'assigned', fn ($q) => $q->whereNotNull('default_vehicle_id'))
            ->when($request->string('vehicle_assignment')->toString() === 'unassigned', fn ($q) => $q->whereNull('default_vehicle_id'))
            ->when($request->string('students_assignment')->toString() === 'with_students', fn ($q) => $q->has('students'))
            ->when($request->string('students_assignment')->toString() === 'without_students', fn ($q) => $q->doesntHave('students'))
            ->when($request->boolean('dispatch_eligible'), function ($query) {
                $query->where('status', 'active')
                    ->whereHas('user', fn ($u) => $u->where('is_active', true)->where('role', 'driver'));
            });

        $this->applyListSort($drivers, $request, [
            'employee_id', 'first_name', 'last_name', 'status', 'license_expiry', 'license_number',
        ], 'last_name');

        $drivers = $drivers->paginate($request->integer('per_page', 15));

        return response()->json($drivers);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $drivers = Driver::forOrganization($orgId);
        $drivers = $this->applySchoolDriverScope($request->user(), $drivers);
        $drivers = $this->applyContractorOwnedScope($request->user(), $drivers);

        $total = (clone $drivers)->count();
        $active = (clone $drivers)->where('status', 'active')->count();
        $withVehicle = (clone $drivers)->whereNotNull('default_vehicle_id')->count();
        $withStudents = (clone $drivers)->has('students')->count();
        $licenseExpiringSoon = (clone $drivers)
            ->where('status', 'active')
            ->whereNotNull('license_expiry')
            ->whereBetween('license_expiry', [now()->toDateString(), now()->addDays(30)->toDateString()])
            ->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'active' => $active,
                'with_vehicle' => $withVehicle,
                'with_students' => $withStudents,
                'license_expiring_soon' => $licenseExpiringSoon,
                'vehicle_assignment_pct' => $active > 0 ? (int) round($withVehicle / $active * 100) : 0,
            ],
        ]);
    }

    public function show(Request $request, Driver $driver): JsonResponse
    {
        $this->authorizeOrg($request, $driver);
        $this->authorizeDriverInSchoolScope($request->user(), $driver);

        $driver->load([
            'defaultVehicle:id,vehicle_number,type,status,make,model,year,capacity,wheelchair_capacity,license_plate,fuel_type',
            'documents:id,driver_id,document_type,original_filename,expiry_date,status,created_at',
            'students' => fn ($q) => $q->where('status', 'active')
                ->with('school:id,name,code')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->limit(25)
                ->select(['id', 'student_number', 'first_name', 'last_name', 'grade', 'school_id', 'assigned_driver_id']),
        ])->loadCount('students');

        return response()->json([
            'data' => $driver,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $data = $this->validateData($request);
        $vehiclePayload = $data['vehicle'] ?? null;
        unset($data['vehicle']);

        $contractorId = $request->user()->role === 'contractor' ? $request->user()->id : null;

        $driver = DB::transaction(function () use ($orgId, $data, $vehiclePayload, $contractorId, $request) {
            $data['organization_id'] = $orgId;
            if ($contractorId) {
                $data['contractor_id'] = $contractorId;
            }

            if ($vehiclePayload) {
                $vehicle = Vehicle::create([
                    'organization_id' => $orgId,
                    'contractor_id' => $contractorId,
                    'vehicle_number' => $vehiclePayload['vehicle_number'],
                    'type' => $vehiclePayload['type'],
                    'capacity' => $vehiclePayload['capacity'] ?? null,
                    'wheelchair_capacity' => $vehiclePayload['wheelchair_capacity'] ?? 0,
                    'make' => $vehiclePayload['make'] ?? null,
                    'model' => $vehiclePayload['model'] ?? null,
                    'status' => 'active',
                ]);
                $data['default_vehicle_id'] = $vehicle->id;
            }

            if (! empty($data['default_vehicle_id'])) {
                $this->assertVehicleInOrg($orgId, $data['default_vehicle_id']);
                $this->releaseVehicleFromOtherDrivers($orgId, $data['default_vehicle_id']);
            }

            $driver = Driver::create($data);

            $this->storeDriverCredentialDocuments(
                $request,
                $driver,
                $request->user()->id,
                $request->hasFile('license_document'),
                $request->hasFile('insurance_document'),
            );

            return $driver->fresh(['defaultVehicle:id,vehicle_number,type,status']);
        });

        return response()->json([
            'data' => $driver->load('defaultVehicle:id,vehicle_number,type,status'),
        ], 201);
    }

    public function update(Request $request, Driver $driver): JsonResponse
    {
        $this->authorizeOrg($request, $driver);

        $orgId = $request->user()->organization_id;
        $data = $this->validateData($request);
        $vehiclePayload = $data['vehicle'] ?? null;
        unset($data['vehicle']);

        DB::transaction(function () use ($orgId, $driver, $data, $vehiclePayload, $request) {
            if ($vehiclePayload) {
                $vehicle = Vehicle::create([
                    'organization_id' => $orgId,
                    'vehicle_number' => $vehiclePayload['vehicle_number'],
                    'type' => $vehiclePayload['type'],
                    'capacity' => $vehiclePayload['capacity'] ?? null,
                    'wheelchair_capacity' => $vehiclePayload['wheelchair_capacity'] ?? 0,
                    'make' => $vehiclePayload['make'] ?? null,
                    'model' => $vehiclePayload['model'] ?? null,
                    'status' => 'active',
                ]);
                $data['default_vehicle_id'] = $vehicle->id;
            }

            if (array_key_exists('default_vehicle_id', $data) && $data['default_vehicle_id']) {
                $this->assertVehicleInOrg($orgId, $data['default_vehicle_id']);
                $this->releaseVehicleFromOtherDrivers($orgId, $data['default_vehicle_id'], $driver->id);
            }

            $driver->update($data);

            $this->storeDriverCredentialDocuments(
                $request,
                $driver->fresh(),
                $request->user()->id,
                false,
                false,
            );
        });

        return response()->json([
            'data' => $driver->fresh()->load([
                'defaultVehicle:id,vehicle_number,type,status',
                'documents:id,driver_id,document_type,original_filename,expiry_date,status,created_at',
            ]),
        ]);
    }

    public function assignVehicle(Request $request, Driver $driver): JsonResponse
    {
        $this->authorizeOrg($request, $driver);

        $data = $request->validate([
            'default_vehicle_id' => ['nullable', 'uuid', 'exists:vehicles,id'],
        ]);

        $orgId = $request->user()->organization_id;

        DB::transaction(function () use ($orgId, $driver, $data) {
            if (! empty($data['default_vehicle_id'])) {
                $this->assertVehicleInOrg($orgId, $data['default_vehicle_id']);
                $this->releaseVehicleFromOtherDrivers($orgId, $data['default_vehicle_id'], $driver->id);
            }

            $driver->update(['default_vehicle_id' => $data['default_vehicle_id'] ?? null]);
        });

        return response()->json([
            'data' => $driver->fresh()->load('defaultVehicle:id,vehicle_number,type,status,make,model'),
            'message' => 'Vehicle assignment updated.',
        ]);
    }

    public function updateStatus(Request $request, Driver $driver): JsonResponse
    {
        $this->authorizeOrg($request, $driver);

        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,on_leave,terminated'],
        ]);

        $driver->update($data);

        return response()->json([
            'data' => $driver->fresh()->load('defaultVehicle:id,vehicle_number,type,status'),
            'message' => 'Status updated.',
        ]);
    }

    public function destroy(Request $request, Driver $driver): JsonResponse
    {
        $this->authorizeOrg($request, $driver);

        $driver->delete();

        return response()->json(['message' => 'Driver deleted.']);
    }

    public function studentAssignments(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $schoolId = $this->schoolScopeId($request->user());

        $drivers = Driver::forOrganization($orgId);
        $drivers = $this->applySchoolDriverScope($request->user(), $drivers);
        $drivers = $this->applyContractorOwnedScope($request->user(), $drivers);
        $drivers = $drivers
            ->with([
                'defaultVehicle:id,vehicle_number,type,status',
                'students' => function ($q) use ($request, $schoolId) {
                    $q->select('id', 'first_name', 'last_name', 'grade', 'status', 'school_id', 'assigned_driver_id', 'student_number')
                        ->with('school:id,name,code')
                        ->when($schoolId, fn ($query) => $query->where('school_id', $schoolId))
                        ->when($request->string('search')->toString(), function ($query, $search) {
                            $query->where(function ($inner) use ($search) {
                                $inner->where('first_name', 'like', "%{$search}%")
                                    ->orWhere('last_name', 'like', "%{$search}%")
                                    ->orWhere('student_number', 'like', "%{$search}%");
                            });
                        })
                        ->when($request->string('student_status')->toString(), fn ($query, $status) => $query->where('status', $status))
                        ->when($request->string('school_id')->toString(), fn ($query, $schoolId) => $query->where('school_id', $schoolId))
                        ->when($request->string('grade')->toString(), fn ($query, $grade) => $query->where('grade', $grade))
                        ->orderBy('last_name');
                },
            ])
            ->withCount('students')
            ->when($request->string('driver_id')->toString(), fn ($q, $id) => $q->where('id', $id))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('license_class')->toString(), fn ($q, $cls) => $q->where('license_class', $cls))
            ->when($request->string('vehicle_assignment')->toString() === 'assigned', fn ($q) => $q->whereNotNull('default_vehicle_id'))
            ->when($request->string('vehicle_assignment')->toString() === 'unassigned', fn ($q) => $q->whereNull('default_vehicle_id'))
            ->when($request->string('students_assignment')->toString() === 'with_students', fn ($q) => $q->has('students'))
            ->when($request->string('students_assignment')->toString() === 'without_students', fn ($q) => $q->doesntHave('students'))
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->orderBy('last_name')
            ->get();

        $filtered = $drivers->filter(function ($driver) use ($request) {
            if ($request->string('search')->toString() && $driver->students->isEmpty()) {
                return false;
            }
            if ($request->string('student_status')->toString() || $request->string('school_id')->toString() || $request->string('grade')->toString()) {
                return $driver->students->isNotEmpty();
            }

            return true;
        })->values();

        return response()->json(['data' => $filtered]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate(array_merge([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'employee_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'endorsements' => ['nullable', 'array'],
            'endorsements.*' => ['string', 'max:5'],
            'hire_date' => ['nullable', 'date'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'medical_cert_expiry' => ['nullable', 'date'],
            'background_check_date' => ['nullable', 'date'],
            'drug_test_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive,on_leave,terminated'],
            'notes' => ['nullable', 'string'],
            'default_vehicle_id' => ['nullable', 'uuid', 'exists:vehicles,id'],
            'vehicle' => ['nullable', 'array'],
            'vehicle.vehicle_number' => ['required_with:vehicle', 'string', 'max:50'],
            'vehicle.type' => ['required_with:vehicle', 'in:bus,van,minivan,sedan,wheelchair_van'],
            'vehicle.capacity' => ['nullable', 'integer', 'min:1'],
            'vehicle.wheelchair_capacity' => ['nullable', 'integer', 'min:0'],
            'vehicle.make' => ['nullable', 'string', 'max:100'],
            'vehicle.model' => ['nullable', 'string', 'max:100'],
            'license_number' => ['required', 'string', 'max:50'],
            'license_class' => ['required', 'string', 'max:20'],
            'license_state' => ['required', 'string', 'max:2'],
            'license_expiry' => ['required', 'date'],
            'insurance_provider' => ['required', 'string', 'max:150'],
            'insurance_policy_number' => ['required', 'string', 'max:80'],
            'insurance_expiry' => ['required', 'date'],
            'license_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'insurance_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ]));
    }

    private function assertVehicleInOrg(string $orgId, string $vehicleId): void
    {
        $exists = Vehicle::where('id', $vehicleId)->where('organization_id', $orgId)->exists();
        if (! $exists) {
            throw ValidationException::withMessages([
                'default_vehicle_id' => ['Selected vehicle is not valid for your organization.'],
            ]);
        }
    }

    private function releaseVehicleFromOtherDrivers(string $orgId, string $vehicleId, ?string $exceptDriverId = null): void
    {
        Driver::where('organization_id', $orgId)
            ->where('default_vehicle_id', $vehicleId)
            ->when($exceptDriverId, fn ($q) => $q->where('id', '!=', $exceptDriverId))
            ->update(['default_vehicle_id' => null]);
    }

    private function authorizeOrg(Request $request, Driver $driver): void
    {
        abort_unless($driver->organization_id === $request->user()->organization_id, 404);

        if ($request->user()->role === 'contractor' && $driver->contractor_id !== $request->user()->id) {
            abort(403, 'You can only manage your own drivers.');
        }
    }
}
