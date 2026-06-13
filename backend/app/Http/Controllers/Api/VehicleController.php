<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VehicleController extends Controller
{
    use ResolvesAccessScope;
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $vehicles = Vehicle::forOrganization($orgId);
        $vehicles = $this->applyContractorOwnedScope($request->user(), $vehicles);
        $vehicles = $vehicles
            ->with('assignedDriver:id,first_name,last_name,employee_id,status,email,phone,default_vehicle_id')
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('vehicle_number', 'like', "%{$search}%")
                        ->orWhere('make', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('license_plate', 'like', "%{$search}%");
                });
            })
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('type')->toString(), fn ($q, $type) => $q->where('type', $type))
            ->when($request->string('assignment')->toString() === 'assigned', fn ($q) => $q->whereHas('assignedDriver'))
            ->when($request->string('assignment')->toString() === 'unassigned', fn ($q) => $q->whereDoesntHave('assignedDriver'));

        $this->applyListSort($vehicles, $request, [
            'vehicle_number', 'make', 'model', 'year', 'license_plate', 'status', 'capacity',
        ], 'vehicle_number');

        $vehicles = $vehicles->paginate($request->integer('per_page', 15));

        return response()->json($vehicles);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $vehicles = Vehicle::forOrganization($orgId);
        $vehicles = $this->applyContractorOwnedScope($request->user(), $vehicles);

        $total = (clone $vehicles)->count();
        $active = (clone $vehicles)->where('status', 'active')->count();
        $activeAssigned = (clone $vehicles)->where('status', 'active')->whereHas('assignedDriver')->count();
        $maintenance = (clone $vehicles)->where('status', 'maintenance')->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'active' => $active,
                'assigned' => $activeAssigned,
                'unassigned' => max(0, $active - $activeAssigned),
                'maintenance' => $maintenance,
                'assignment_pct' => $active > 0 ? (int) round($activeAssigned / $active * 100) : 0,
            ],
        ]);
    }

    public function show(Request $request, Vehicle $vehicle): JsonResponse
    {
        $this->authorizeOrg($request, $vehicle);

        return response()->json([
            'data' => $vehicle->load('assignedDriver:id,first_name,last_name,employee_id,status,email,phone'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $data['organization_id'] = $request->user()->organization_id;
        if ($request->user()->role === 'contractor') {
            $data['contractor_id'] = $request->user()->id;
        }

        $vehicle = Vehicle::create($data);

        return response()->json(['data' => $vehicle], 201);
    }

    public function update(Request $request, Vehicle $vehicle): JsonResponse
    {
        $this->authorizeOrg($request, $vehicle);

        $vehicle->update($this->validateData($request));

        return response()->json(['data' => $vehicle]);
    }

    public function assignDriver(Request $request, Vehicle $vehicle): JsonResponse
    {
        $this->authorizeOrg($request, $vehicle);

        $data = $request->validate([
            'driver_id' => ['nullable', 'uuid', 'exists:drivers,id'],
        ]);

        $orgId = $request->user()->organization_id;

        DB::transaction(function () use ($orgId, $vehicle, $data, $request) {
            Driver::where('organization_id', $orgId)
                ->where('default_vehicle_id', $vehicle->id)
                ->update(['default_vehicle_id' => null]);

            if (! empty($data['driver_id'])) {
                $driver = Driver::where('id', $data['driver_id'])
                    ->where('organization_id', $orgId)
                    ->first();

                if (! $driver) {
                    throw ValidationException::withMessages([
                        'driver_id' => ['Selected driver is not valid for your organization.'],
                    ]);
                }

                if ($request->user()->role === 'contractor' && $driver->contractor_id !== $request->user()->id) {
                    throw ValidationException::withMessages([
                        'driver_id' => ['You can only assign your own drivers.'],
                    ]);
                }

                Driver::where('organization_id', $orgId)
                    ->where('default_vehicle_id', $vehicle->id)
                    ->where('id', '!=', $driver->id)
                    ->update(['default_vehicle_id' => null]);

                $driver->update(['default_vehicle_id' => $vehicle->id]);
            }
        });

        return response()->json([
            'data' => $vehicle->fresh()->load('assignedDriver:id,first_name,last_name,employee_id,status,email,phone'),
            'message' => 'Driver assignment updated.',
        ]);
    }

    public function updateStatus(Request $request, Vehicle $vehicle): JsonResponse
    {
        $this->authorizeOrg($request, $vehicle);

        $data = $request->validate([
            'status' => ['required', 'in:active,maintenance,retired,out_of_service'],
        ]);

        $vehicle->update($data);

        return response()->json([
            'data' => $vehicle->fresh()->load('assignedDriver:id,first_name,last_name,employee_id,status,email,phone'),
            'message' => 'Status updated.',
        ]);
    }

    public function destroy(Request $request, Vehicle $vehicle): JsonResponse
    {
        $this->authorizeOrg($request, $vehicle);

        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'vehicle_number' => ['required', 'string', 'max:50'],
            'vin' => ['nullable', 'string', 'max:17'],
            'make' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'min:1980', 'max:2100'],
            'type' => ['required', 'in:bus,van,minivan,sedan,wheelchair_van'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'wheelchair_capacity' => ['nullable', 'integer', 'min:0'],
            'license_plate' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:active,maintenance,retired,out_of_service'],
            'fuel_type' => ['nullable', 'in:diesel,gas,electric,hybrid'],
            'cost_per_mile' => ['nullable', 'numeric', 'min:0'],
        ]);
    }

    private function authorizeOrg(Request $request, Vehicle $vehicle): void
    {
        abort_unless($vehicle->organization_id === $request->user()->organization_id, 404);

        if ($request->user()->role === 'contractor' && $vehicle->contractor_id !== $request->user()->id) {
            abort(403, 'You can only manage your own vehicles.');
        }
    }
}
