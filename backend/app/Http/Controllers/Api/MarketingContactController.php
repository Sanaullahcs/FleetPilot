<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Models\MarketingContactRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketingContactController extends Controller
{
    use SortsQueries;

    /** Public website contact form (no auth). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'inquiry_type' => ['nullable', 'in:demo,pricing,support,partnership,other'],
            'role_type' => ['nullable', 'in:district,contractor,school,other'],
            'fleet_size' => ['nullable', 'string', 'max:40'],
            'subject' => ['nullable', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $lead = MarketingContactRequest::create([
            ...$data,
            'inquiry_type' => $data['inquiry_type'] ?? 'demo',
            'role_type' => $data['role_type'] ?? 'district',
            'source' => 'website',
            'status' => 'new',
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return response()->json([
            'message' => 'Thanks for reaching out. Our team will contact you shortly.',
            'data' => [
                'id' => $lead->id,
            ],
        ], 201);
    }

    /** Super admin inbox. */
    public function index(Request $request): JsonResponse
    {
        $query = MarketingContactRequest::query()
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('organization_name', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            });

        $this->applyListSort($query, $request, [
            'full_name', 'email', 'organization_name', 'status', 'created_at',
        ], 'created_at', 'desc');

        $paginated = $query->paginate($request->integer('per_page', 20));

        return response()->json($paginated);
    }

    public function stats(): JsonResponse
    {
        $base = MarketingContactRequest::query();

        return response()->json([
            'data' => [
                'total' => (clone $base)->count(),
                'new' => (clone $base)->where('status', 'new')->count(),
                'read' => (clone $base)->where('status', 'read')->count(),
                'archived' => (clone $base)->where('status', 'archived')->count(),
            ],
        ]);
    }

    public function show(MarketingContactRequest $marketingContact): JsonResponse
    {
        return response()->json(['data' => $marketingContact->load('readBy:id,first_name,last_name,email')]);
    }

    public function markRead(Request $request, MarketingContactRequest $marketingContact): JsonResponse
    {
        if ($marketingContact->status === 'new') {
            $marketingContact->update([
                'status' => 'read',
                'read_at' => now(),
                'read_by_user_id' => $request->user()->id,
            ]);
        }

        return response()->json([
            'message' => 'Marked as read.',
            'data' => $marketingContact->fresh(),
        ]);
    }

    public function archive(MarketingContactRequest $marketingContact): JsonResponse
    {
        $marketingContact->update(['status' => 'archived']);

        return response()->json([
            'message' => 'Lead archived.',
            'data' => $marketingContact->fresh(),
        ]);
    }
}
