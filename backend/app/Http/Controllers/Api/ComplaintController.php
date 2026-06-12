<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\Complaint;
use App\Services\ComplaintService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ComplaintController extends Controller
{
    use SortsQueries;

    public function __construct(private readonly ComplaintService $complaints)
    {
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        return response()->json(['data' => $this->complaints->stats($orgId)]);
    }

    public function assignees(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        return response()->json(['data' => $this->complaints->assigneeOptions($orgId)]);
    }

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        $query = $this->complaints->applyFilters($this->complaints->staffQuery($orgId), [
            'search' => $request->string('search')->toString() ?: null,
            'status' => $request->string('status')->toString() ?: null,
            'category' => $request->string('category')->toString() ?: null,
            'priority' => $request->string('priority')->toString() ?: null,
            'submitter_role' => $request->string('submitter_role')->toString() ?: null,
            'assigned_to_user_id' => $request->string('assigned_to_user_id')->toString() ?: null,
            'assignment' => $request->string('assignment')->toString() ?: null,
            'school_id' => $request->string('school_id')->toString() ?: null,
        ]);

        $this->applyListSort($query, $request, [
            'reference_number',
            'subject',
            'status',
            'priority',
            'submitter_role',
            'created_at',
            'last_activity_at',
        ], 'last_activity_at', 'desc');

        $page = $query->paginate($request->integer('per_page', 15));
        $page->getCollection()->transform(fn (Complaint $c) => $this->complaints->formatListItem($c, true));

        return response()->json($page);
    }

    public function show(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorizeView($request, $complaint);
        $complaint->load([
            'submitter:id,first_name,last_name,email,phone,role',
            'assignee:id,first_name,last_name',
            'student:id,first_name,last_name',
            'driver:id,first_name,last_name',
            'school:id,name',
            'route:id,name,code',
            'updates.user:id,first_name,last_name,role',
        ]);

        return response()->json([
            'data' => $this->complaints->formatDetail($complaint, $request->user()),
        ]);
    }

    public function update(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorizeView($request, $complaint);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in(array_keys(ComplaintService::STATUSES))],
            'priority' => ['sometimes', Rule::in(array_keys(ComplaintService::PRIORITIES))],
            'assigned_to_user_id' => ['nullable', 'uuid'],
            'resolution_summary' => ['nullable', 'string', 'max:5000'],
            'public_note' => ['nullable', 'string', 'max:5000'],
            'internal_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $updated = $this->complaints->updateByStaff($request->user(), $complaint, $data);
        $updated->load([
            'submitter:id,first_name,last_name,email,phone,role',
            'assignee:id,first_name,last_name',
            'student:id,first_name,last_name',
            'driver:id,first_name,last_name',
            'school:id,name',
            'route:id,name,code',
            'updates.user:id,first_name,last_name,role',
        ]);

        return response()->json([
            'data' => $this->complaints->formatDetail($updated, $request->user()),
        ]);
    }

    private function authorizeView(Request $request, Complaint $complaint): void
    {
        if (! $this->complaints->canView($request->user(), $complaint)) {
            abort(403, 'You cannot access this complaint.');
        }
    }
}
