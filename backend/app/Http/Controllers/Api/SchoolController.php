<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesAccessScope;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\Route;
use App\Models\School;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    use ResolvesAccessScope;
    use SortsQueries;

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $schoolId = $this->schoolScopeId($request->user());
        $contractorSchoolIds = $this->contractorSchoolIds($request->user());

        $schools = $this->baseQuery($orgId)
            ->when($schoolId, fn ($q) => $q->where('id', $schoolId))
            ->when($contractorSchoolIds !== null, fn ($q) => $q->whereIn('id', $contractorSchoolIds ?: ['__none__']))
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('district', 'like', "%{$search}%")
                        ->orWhere('principal_name', 'like', "%{$search}%");
                });
            })
            ->when($request->string('district')->toString(), fn ($q, $d) => $q->where('district', $d))
            ->when($request->string('state')->toString(), fn ($q, $s) => $q->where('state', $s))
            ->when($request->string('city')->toString(), fn ($q, $c) => $q->where('city', $c))
            ->when($request->string('enrollment')->toString(), function ($query, $enrollment) {
                if ($enrollment === 'with_students') {
                    $query->has('students');
                } elseif ($enrollment === 'without_students') {
                    $query->whereDoesntHave('students');
                }
            });

        $this->applyListSort($schools, $request, [
            'code', 'name', 'district', 'city', 'state',
        ], 'name');

        $schools = $schools->paginate($request->integer('per_page', 50));

        return response()->json($schools);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $schools = School::forOrganization($orgId);

        $totalSchools = (clone $schools)->count();
        $withStudents = (clone $schools)->has('students')->count();
        $totalStudents = Student::forOrganization($orgId)->where('status', 'active')->count();
        $totalRoutes = Route::forOrganization($orgId)->where('status', 'active')->count();
        $districts = (clone $schools)->whereNotNull('district')->distinct()->count('district');

        return response()->json([
            'data' => [
                'schools' => $totalSchools,
                'districts' => $districts,
                'students_enrolled' => $totalStudents,
                'active_routes' => $totalRoutes,
                'schools_with_students' => $withStudents,
                'avg_students_per_school' => $totalSchools > 0
                    ? round($totalStudents / $totalSchools, 1)
                    : 0,
            ],
        ]);
    }

    public function filterOptions(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $schools = School::forOrganization($orgId);

        return response()->json([
            'data' => [
                'districts' => (clone $schools)->whereNotNull('district')->distinct()->orderBy('district')->pluck('district')->values(),
                'states' => (clone $schools)->whereNotNull('state')->distinct()->orderBy('state')->pluck('state')->values(),
                'cities' => (clone $schools)->whereNotNull('city')->distinct()->orderBy('city')->pluck('city')->values(),
            ],
        ]);
    }

    private function baseQuery(string $orgId)
    {
        return School::forOrganization($orgId)
            ->withCount([
                'students',
                'students as active_students_count' => fn ($q) => $q->where('status', 'active'),
                'routes',
                'routes as active_routes_count' => fn ($q) => $q->where('status', 'active'),
            ]);
    }

    public function show(Request $request, School $school): JsonResponse
    {
        $this->authorizeOrg($request, $school);

        $school->loadCount([
            'students',
            'students as active_students_count' => fn ($q) => $q->where('status', 'active'),
            'routes',
            'routes as active_routes_count' => fn ($q) => $q->where('status', 'active'),
        ]);

        return response()->json(['data' => $school]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $data['organization_id'] = $request->user()->organization_id;

        $school = School::create($data);

        return response()->json(['data' => $school], 201);
    }

    public function update(Request $request, School $school): JsonResponse
    {
        $this->authorizeOrg($request, $school);

        $school->update($this->validateData($request));

        return response()->json(['data' => $school]);
    }

    public function destroy(Request $request, School $school): JsonResponse
    {
        $this->authorizeOrg($request, $school);

        $school->delete();

        return response()->json(['message' => 'School deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'district' => ['nullable', 'string', 'max:255'],
            'grade_levels' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:2'],
            'zip' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:20'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'principal_name' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'bell_times' => ['nullable', 'array'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);
    }

    private function authorizeOrg(Request $request, School $school): void
    {
        abort_unless($school->organization_id === $request->user()->organization_id, 404);

        $schoolId = $this->schoolScopeId($request->user());
        if ($schoolId && $school->id !== $schoolId) {
            abort(403, 'You can only access your assigned school.');
        }

        $contractorSchoolIds = $this->contractorSchoolIds($request->user());
        if ($contractorSchoolIds !== null && ! in_array($school->id, $contractorSchoolIds, true)) {
            abort(403, 'You can only access schools assigned to you.');
        }
    }
}
