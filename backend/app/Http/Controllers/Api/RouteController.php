<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\Route;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $routes = Route::forOrganization($orgId)
            ->with('school:id,name')
            ->withCount('runs')
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->when($request->string('type')->toString(), fn ($q, $type) => $q->where('type', $type));

        $this->applyListSort($routes, $request, [
            'code', 'name', 'type', 'status',
        ], 'name');

        $routes = $routes->paginate($request->integer('per_page', 15));

        return response()->json($routes);
    }

    public function show(Request $request, Route $route): JsonResponse
    {
        $this->authorizeOrg($request, $route);

        $route->load([
            'school:id,name,code,city,state',
            'runs' => fn ($q) => $q->orderBy('scheduled_start_time'),
        ])->loadCount('runs');

        return response()->json(['data' => $route]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $data['organization_id'] = $request->user()->organization_id;
        $data['created_by'] = $request->user()->id;

        $route = Route::create($data);

        return response()->json(['data' => $route], 201);
    }

    public function update(Request $request, Route $route): JsonResponse
    {
        $this->authorizeOrg($request, $route);

        $route->update($this->validateData($request));

        return response()->json(['data' => $route]);
    }

    public function updateStatus(Request $request, Route $route): JsonResponse
    {
        $this->authorizeOrg($request, $route);

        $data = $request->validate([
            'status' => ['required', 'in:active,inactive,draft'],
        ]);

        $route->update($data);

        return response()->json([
            'data' => $route->fresh()->load('school:id,name'),
            'message' => 'Status updated.',
        ]);
    }

    public function destroy(Request $request, Route $route): JsonResponse
    {
        $this->authorizeOrg($request, $route);

        $route->delete();

        return response()->json(['message' => 'Route deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
            'type' => ['required', 'in:am,pm,midday,activity,sped,charter'],
            'days_of_week' => ['nullable', 'array'],
            'status' => ['nullable', 'in:active,inactive,draft'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function authorizeOrg(Request $request, Route $route): void
    {
        abort_unless($route->organization_id === $request->user()->organization_id, 404);
    }
}
