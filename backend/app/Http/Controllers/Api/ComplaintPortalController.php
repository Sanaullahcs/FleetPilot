<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Services\ComplaintService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ComplaintPortalController extends Controller
{
    public function __construct(private readonly ComplaintService $complaints)
    {
    }

    public function formOptions(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->complaints->formOptions($request->user())]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $this->complaints->submitterQuery($user);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $items = $query->orderByDesc('last_activity_at')->get()
            ->map(fn (Complaint $c) => $this->complaints->formatListItem($c));

        return response()->json(['data' => ['items' => $items, 'total' => $items->count()]]);
    }

    public function show(Request $request, Complaint $complaint): JsonResponse
    {
        if (! $this->complaints->canView($request->user(), $complaint)) {
            abort(403);
        }

        $complaint->load([
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::in(array_keys(ComplaintService::CATEGORIES))],
            'subject' => ['required', 'string', 'min:5', 'max:200'],
            'description' => ['required', 'string', 'min:20', 'max:10000'],
            'priority' => ['sometimes', Rule::in(array_keys(ComplaintService::PRIORITIES))],
            'preferred_contact' => ['sometimes', Rule::in(array_keys(ComplaintService::CONTACT_METHODS))],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'incident_date' => ['nullable', 'date', 'before_or_equal:today'],
            'location_note' => ['nullable', 'string', 'max:255'],
            'student_id' => ['nullable', 'uuid'],
            'route_id' => ['nullable', 'uuid'],
            'school_id' => ['nullable', 'uuid'],
        ]);

        $complaint = $this->complaints->create($request->user(), $data);
        $complaint->load([
            'submitter:id,first_name,last_name,email,phone,role',
            'student:id,first_name,last_name',
            'school:id,name',
            'route:id,name,code',
            'updates.user:id,first_name,last_name,role',
        ]);

        return response()->json([
            'data' => $this->complaints->formatDetail($complaint, $request->user()),
        ], 201);
    }

    public function addComment(Request $request, Complaint $complaint): JsonResponse
    {
        if (! $this->complaints->canView($request->user(), $complaint)) {
            abort(403);
        }

        $data = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        $this->complaints->addSubmitterComment($request->user(), $complaint, $data['body']);

        $complaint->load([
            'assignee:id,first_name,last_name',
            'student:id,first_name,last_name',
            'school:id,name',
            'route:id,name,code',
            'updates.user:id,first_name,last_name,role',
        ]);

        return response()->json([
            'data' => $this->complaints->formatDetail($complaint->fresh(), $request->user()),
        ]);
    }
}
