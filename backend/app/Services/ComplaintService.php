<?php

namespace App\Services;

use App\Models\Complaint;
use App\Models\ComplaintUpdate;
use App\Models\Driver;
use App\Models\ParentAccount;
use App\Models\ParentStudent;
use App\Models\Route;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ComplaintService
{
    /** @var array<string, string> */
    public const CATEGORIES = [
        'safety' => 'Safety concern',
        'route_service' => 'Route or schedule',
        'driver_conduct' => 'Driver conduct',
        'vehicle_condition' => 'Vehicle condition',
        'student_issue' => 'Student-related issue',
        'billing' => 'Billing or fees',
        'communication' => 'Communication',
        'app_technical' => 'App or technical issue',
        'facility_access' => 'School or facility access',
        'other' => 'Other',
    ];

    /** @var array<string, string> */
    public const STATUSES = [
        'submitted' => 'Submitted',
        'acknowledged' => 'Acknowledged',
        'in_progress' => 'In progress',
        'waiting_on_submitter' => 'Waiting on you',
        'resolved' => 'Resolved',
        'closed' => 'Closed',
        'rejected' => 'Not accepted',
    ];

    /** @var array<string, string> */
    public const PRIORITIES = [
        'low' => 'Low',
        'normal' => 'Normal',
        'high' => 'High',
        'urgent' => 'Urgent',
    ];

    /** @var array<string, string> */
    public const CONTACT_METHODS = [
        'app' => 'In-app messages',
        'phone' => 'Phone call',
        'email' => 'Email',
    ];

    /** @var array<int, string> */
    private const SUBMITTER_ROLES = ['parent', 'driver', 'school_contact'];

    /** @var array<int, string> */
    private const STAFF_ROLES = ['admin', 'dispatcher'];

    public function formOptions(User $user): array
    {
        $orgId = $user->organization_id;
        $role = $user->role;

        $options = [
            'categories' => collect(self::CATEGORIES)->map(fn ($label, $value) => compact('value', 'label'))->values()->all(),
            'priorities' => collect(self::PRIORITIES)->map(fn ($label, $value) => compact('value', 'label'))->values()->all(),
            'contact_methods' => collect(self::CONTACT_METHODS)->map(fn ($label, $value) => compact('value', 'label'))->values()->all(),
            'students' => [],
            'routes' => [],
            'school' => null,
            'organization' => [
                'name' => $user->organization?->name,
                'phone' => $user->organization?->phone,
                'email' => $user->organization?->email,
            ],
        ];

        if ($role === 'parent') {
            $studentIds = $this->parentStudentIds($user);
            $options['students'] = Student::query()
                ->whereIn('id', $studentIds)
                ->where('organization_id', $orgId)
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'grade'])
                ->map(fn (Student $s) => [
                    'id' => $s->id,
                    'name' => trim("{$s->first_name} {$s->last_name}"),
                    'grade' => $s->grade,
                ])
                ->all();
        }

        if ($role === 'driver') {
            $driver = Driver::where('user_id', $user->id)->first();
            if ($driver) {
                $options['routes'] = Route::forOrganization($orgId)
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(['id', 'name', 'code'])
                    ->map(fn (Route $r) => [
                        'id' => $r->id,
                        'name' => $r->name,
                        'code' => $r->code,
                    ])
                    ->all();
            }
        }

        if ($role === 'school_contact' && $user->school_id) {
            $school = School::find($user->school_id);
            if ($school) {
                $options['school'] = [
                    'id' => $school->id,
                    'name' => $school->name,
                    'district' => $school->district,
                ];
            }
        }

        return $options;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, array $data): Complaint
    {
        if (! in_array($user->role, self::SUBMITTER_ROLES, true)) {
            throw ValidationException::withMessages([
                'role' => ['Your account cannot file complaints through this channel.'],
            ]);
        }

        $orgId = $user->organization_id;
        $this->assertRelatedEntities($user, $data);

        return DB::transaction(function () use ($user, $data, $orgId) {
            $complaint = Complaint::create([
                'organization_id' => $orgId,
                'reference_number' => $this->nextReferenceNumber($orgId),
                'submitted_by_user_id' => $user->id,
                'submitter_role' => $user->role,
                'category' => $data['category'],
                'subject' => $data['subject'],
                'description' => $data['description'],
                'status' => 'submitted',
                'priority' => $data['priority'] ?? 'normal',
                'preferred_contact' => $data['preferred_contact'] ?? 'app',
                'contact_phone' => $data['contact_phone'] ?? $user->phone,
                'incident_date' => $data['incident_date'] ?? null,
                'location_note' => $data['location_note'] ?? null,
                'student_id' => $data['student_id'] ?? null,
                'driver_id' => $data['driver_id'] ?? null,
                'school_id' => $data['school_id'] ?? ($user->role === 'school_contact' ? $user->school_id : null),
                'route_id' => $data['route_id'] ?? null,
                'last_activity_at' => now(),
            ]);

            $this->recordUpdate($complaint, $user, 'system', 'Complaint submitted and queued for review.', false, [
                'event' => 'created',
            ]);

            return $complaint->fresh([
                'submitter:id,first_name,last_name,email,phone,role',
                'student:id,first_name,last_name',
                'driver:id,first_name,last_name',
                'school:id,name',
                'route:id,name,code',
                'assignee:id,first_name,last_name',
            ]);
        });
    }

    public function staffQuery(string $orgId): Builder
    {
        return Complaint::query()
            ->forOrganization($orgId)
            ->with([
                'submitter:id,first_name,last_name,email,phone,role',
                'assignee:id,first_name,last_name',
                'student:id,first_name,last_name',
                'school:id,name',
            ])
            ->withCount(['updates']);
    }

    public function submitterQuery(User $user): Builder
    {
        return Complaint::query()
            ->forOrganization($user->organization_id)
            ->where('submitted_by_user_id', $user->id)
            ->with([
                'assignee:id,first_name,last_name',
                'student:id,first_name,last_name',
                'school:id,name',
                'route:id,name,code',
            ])
            ->withCount(['updates']);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                $q->where(function (Builder $inner) use ($search) {
                    $inner->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('submitter', function (Builder $u) use ($search) {
                            $u->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($filters['category'] ?? null, fn (Builder $q, string $category) => $q->where('category', $category))
            ->when($filters['priority'] ?? null, fn (Builder $q, string $priority) => $q->where('priority', $priority))
            ->when($filters['submitter_role'] ?? null, fn (Builder $q, string $role) => $q->where('submitter_role', $role))
            ->when($filters['assigned_to_user_id'] ?? null, fn (Builder $q, string $id) => $q->where('assigned_to_user_id', $id))
            ->when(($filters['assignment'] ?? null) === 'unassigned', fn (Builder $q) => $q->whereNull('assigned_to_user_id'))
            ->when(($filters['assignment'] ?? null) === 'assigned', fn (Builder $q) => $q->whereNotNull('assigned_to_user_id'))
            ->when($filters['school_id'] ?? null, fn (Builder $q, string $id) => $q->where('school_id', $id));
    }

    public function stats(string $orgId): array
    {
        $base = Complaint::forOrganization($orgId);
        $openStatuses = ['submitted', 'acknowledged', 'in_progress', 'waiting_on_submitter'];

        return [
            'total' => (clone $base)->count(),
            'open' => (clone $base)->whereIn('status', $openStatuses)->count(),
            'urgent' => (clone $base)->where('priority', 'urgent')->whereIn('status', $openStatuses)->count(),
            'unassigned' => (clone $base)->whereNull('assigned_to_user_id')->whereIn('status', $openStatuses)->count(),
            'waiting_on_submitter' => (clone $base)->where('status', 'waiting_on_submitter')->count(),
            'resolved_this_week' => (clone $base)->where('status', 'resolved')
                ->where('resolved_at', '>=', Carbon::now()->startOfWeek())
                ->count(),
            'by_role' => [
                'parent' => (clone $base)->where('submitter_role', 'parent')->whereIn('status', $openStatuses)->count(),
                'driver' => (clone $base)->where('submitter_role', 'driver')->whereIn('status', $openStatuses)->count(),
                'school_contact' => (clone $base)->where('submitter_role', 'school_contact')->whereIn('status', $openStatuses)->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateByStaff(User $staff, Complaint $complaint, array $data): Complaint
    {
        $this->assertStaff($staff);
        $this->assertSameOrg($staff, $complaint);

        return DB::transaction(function () use ($staff, $complaint, $data) {
            $changes = [];

            if (isset($data['status']) && $data['status'] !== $complaint->status) {
                $this->assertValidStatusTransition($complaint->status, $data['status'], true);
                $changes['status'] = ['from' => $complaint->status, 'to' => $data['status']];
                $complaint->status = $data['status'];
                $this->applyStatusTimestamps($complaint, $data['status']);
            }

            if (array_key_exists('priority', $data) && $data['priority'] !== $complaint->priority) {
                $changes['priority'] = ['from' => $complaint->priority, 'to' => $data['priority']];
                $complaint->priority = $data['priority'];
            }

            if (array_key_exists('assigned_to_user_id', $data) && $data['assigned_to_user_id'] !== $complaint->assigned_to_user_id) {
                if ($data['assigned_to_user_id']) {
                    $assignee = User::where('id', $data['assigned_to_user_id'])
                        ->where('organization_id', $complaint->organization_id)
                        ->whereIn('role', self::STAFF_ROLES)
                        ->first();
                    if (! $assignee) {
                        throw ValidationException::withMessages(['assigned_to_user_id' => ['Invalid assignee.']]);
                    }
                }
                $changes['assigned_to_user_id'] = [
                    'from' => $complaint->assigned_to_user_id,
                    'to' => $data['assigned_to_user_id'],
                ];
                $complaint->assigned_to_user_id = $data['assigned_to_user_id'];
            }

            if (array_key_exists('resolution_summary', $data)) {
                $complaint->resolution_summary = $data['resolution_summary'];
            }

            $complaint->last_activity_at = now();
            $complaint->save();

            if (! empty($changes['status'])) {
                $label = self::STATUSES[$changes['status']['to']] ?? $changes['status']['to'];
                $this->recordUpdate(
                    $complaint,
                    $staff,
                    'status_change',
                    "Status updated to {$label}.",
                    false,
                    $changes['status'],
                );
            }

            if (! empty($changes['assigned_to_user_id'])) {
                $complaint->load('assignee:id,first_name,last_name');
                $name = $complaint->assigned_to_user_id
                    ? trim(($complaint->assignee?->first_name ?? '').' '.($complaint->assignee?->last_name ?? ''))
                    : 'Unassigned';
                $this->recordUpdate(
                    $complaint,
                    $staff,
                    'assignment',
                    $complaint->assigned_to_user_id ? "Assigned to {$name}." : 'Assignment cleared.',
                    false,
                    $changes['assigned_to_user_id'],
                );
            }

            if (! empty($data['internal_note'])) {
                $this->recordUpdate($complaint, $staff, 'internal_note', $data['internal_note'], true);
            }

            if (! empty($data['public_note'])) {
                $this->recordUpdate($complaint, $staff, 'comment', $data['public_note'], false);
            }

            return $complaint->fresh([
                'submitter:id,first_name,last_name,email,phone,role',
                'assignee:id,first_name,last_name',
                'student:id,first_name,last_name',
                'driver:id,first_name,last_name',
                'school:id,name',
                'route:id,name,code',
            ]);
        });
    }

    public function addSubmitterComment(User $user, Complaint $complaint, string $body): ComplaintUpdate
    {
        $this->assertCanViewAsSubmitter($user, $complaint);

        if (in_array($complaint->status, ['closed', 'rejected', 'resolved'], true)) {
            throw ValidationException::withMessages([
                'body' => ['This complaint is closed. Open a new complaint if you need further help.'],
            ]);
        }

        $update = $this->recordUpdate($complaint, $user, 'comment', $body, false);
        $complaint->update(['last_activity_at' => now()]);

        if ($complaint->status === 'waiting_on_submitter') {
            $complaint->update(['status' => 'in_progress']);
            $this->recordUpdate($complaint, null, 'system', 'Submitter responded — complaint moved back to in progress.', false, [
                'event' => 'auto_status',
                'from' => 'waiting_on_submitter',
                'to' => 'in_progress',
            ]);
        }

        return $update;
    }

    public function canView(User $user, Complaint $complaint): bool
    {
        if ($user->role === 'super_admin') {
            return true;
        }

        if ($complaint->organization_id !== $user->organization_id) {
            return false;
        }

        if (in_array($user->role, self::STAFF_ROLES, true)) {
            return true;
        }

        return $complaint->submitted_by_user_id === $user->id;
    }

    public function formatListItem(Complaint $complaint, bool $staffView = false): array
    {
        return [
            'id' => $complaint->id,
            'reference_number' => $complaint->reference_number,
            'subject' => $complaint->subject,
            'category' => $complaint->category,
            'category_label' => self::CATEGORIES[$complaint->category] ?? $complaint->category,
            'status' => $complaint->status,
            'status_label' => self::STATUSES[$complaint->status] ?? $complaint->status,
            'priority' => $complaint->priority,
            'priority_label' => self::PRIORITIES[$complaint->priority] ?? $complaint->priority,
            'submitter_role' => $complaint->submitter_role,
            'preferred_contact' => $complaint->preferred_contact,
            'contact_phone' => $complaint->contact_phone,
            'incident_date' => $complaint->incident_date?->toDateString(),
            'location_note' => $complaint->location_note,
            'updates_count' => $complaint->updates_count ?? $complaint->updates()->count(),
            'created_at' => $complaint->created_at?->toIso8601String(),
            'last_activity_at' => ($complaint->last_activity_at ?? $complaint->updated_at)?->toIso8601String(),
            'submitter' => $complaint->submitter ? [
                'id' => $complaint->submitter->id,
                'name' => trim("{$complaint->submitter->first_name} {$complaint->submitter->last_name}"),
                'email' => $complaint->submitter->email,
                'phone' => $complaint->submitter->phone,
                'role' => $complaint->submitter->role,
            ] : null,
            'assignee' => $complaint->assignee ? [
                'id' => $complaint->assignee->id,
                'name' => trim("{$complaint->assignee->first_name} {$complaint->assignee->last_name}"),
            ] : null,
            'student' => $complaint->student ? [
                'id' => $complaint->student->id,
                'name' => trim("{$complaint->student->first_name} {$complaint->student->last_name}"),
            ] : null,
            'school' => $complaint->school ? [
                'id' => $complaint->school->id,
                'name' => $complaint->school->name,
            ] : null,
            'route' => $complaint->relationLoaded('route') && $complaint->route ? [
                'id' => $complaint->route->id,
                'name' => $complaint->route->name,
                'code' => $complaint->route->code,
            ] : null,
            'resolution_summary' => $staffView || in_array($complaint->status, ['resolved', 'closed'], true)
                ? $complaint->resolution_summary
                : ($complaint->status === 'resolved' ? $complaint->resolution_summary : null),
        ];
    }

    public function formatDetail(Complaint $complaint, User $viewer): array
    {
        $staffView = in_array($viewer->role, self::STAFF_ROLES, true);
        $item = $this->formatListItem($complaint, $staffView);
        $item['description'] = $complaint->description;
        $item['resolution_summary'] = $complaint->resolution_summary;
        $item['acknowledged_at'] = $complaint->acknowledged_at?->toIso8601String();
        $item['resolved_at'] = $complaint->resolved_at?->toIso8601String();
        $item['closed_at'] = $complaint->closed_at?->toIso8601String();
        $item['updates'] = $complaint->updates
            ->filter(fn (ComplaintUpdate $update) => $staffView || ! $update->is_internal)
            ->map(fn (ComplaintUpdate $update) => $this->formatUpdate($update))
            ->values()
            ->all();

        return $item;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function dashboardAlerts(string $orgId): array
    {
        $open = Complaint::forOrganization($orgId)
            ->whereIn('status', ['submitted', 'acknowledged', 'in_progress', 'waiting_on_submitter'])
            ->orderByDesc('created_at');

        $newCount = (clone $open)->where('status', 'submitted')->count();
        $urgentCount = (clone $open)->where('priority', 'urgent')->count();

        $items = [];
        if ($newCount > 0) {
            $items[] = [
                'id' => 'complaints_new',
                'category' => 'support',
                'severity' => 'warning',
                'title' => 'New complaints awaiting review',
                'message' => $newCount === 1
                    ? '1 complaint was submitted and needs triage.'
                    : "{$newCount} complaints were submitted and need triage.",
                'count' => $newCount,
                'href' => '/dashboard/complaints?status=submitted',
                'action_label' => 'Open complaint center',
            ];
        }

        if ($urgentCount > 0) {
            $items[] = [
                'id' => 'complaints_urgent',
                'category' => 'support',
                'severity' => 'danger',
                'title' => 'Urgent complaints open',
                'message' => $urgentCount === 1
                    ? '1 urgent complaint requires immediate attention.'
                    : "{$urgentCount} urgent complaints require immediate attention.",
                'count' => $urgentCount,
                'href' => '/dashboard/complaints?priority=urgent',
                'action_label' => 'Review urgent',
            ];
        }

        return $items;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function mobileNotificationItems(User $user): array
    {
        if (! in_array($user->role, self::SUBMITTER_ROLES, true)) {
            return [];
        }

        $items = [];
        $complaints = Complaint::query()
            ->forOrganization($user->organization_id)
            ->where('submitted_by_user_id', $user->id)
            ->whereIn('status', ['acknowledged', 'in_progress', 'waiting_on_submitter', 'resolved'])
            ->orderByDesc('last_activity_at')
            ->limit(10)
            ->get();

        $readMap = $user->profile_meta['read_complaint_ids'] ?? [];

        foreach ($complaints as $complaint) {
            $notificationId = "complaint:{$complaint->id}:{$complaint->status}";
            if (in_array($notificationId, $readMap, true)) {
                continue;
            }

            $title = match ($complaint->status) {
                'waiting_on_submitter' => 'Complaint needs your response',
                'resolved' => 'Complaint resolved',
                default => 'Complaint update',
            };

            $items[] = [
                'id' => $notificationId,
                'category' => 'complaint',
                'severity' => $complaint->status === 'waiting_on_submitter' ? 'warning' : 'info',
                'title' => $title,
                'message' => "{$complaint->reference_number}: {$complaint->subject}",
                'time' => ($complaint->last_activity_at ?? $complaint->updated_at)?->toIso8601String(),
                'read' => false,
                'complaint_id' => $complaint->id,
            ];
        }

        return $items;
    }

    public function markMobileNotificationRead(User $user, string $notificationId): bool
    {
        if (! str_starts_with($notificationId, 'complaint:')) {
            return false;
        }

        $meta = $user->profile_meta ?? [];
        $readIds = $meta['read_complaint_ids'] ?? [];
        if (! in_array($notificationId, $readIds, true)) {
            $readIds[] = $notificationId;
        }
        $meta['read_complaint_ids'] = array_values($readIds);
        $user->update(['profile_meta' => $meta]);

        return true;
    }

    public function markAllMobileNotificationsRead(User $user): void
    {
        if (! in_array($user->role, self::SUBMITTER_ROLES, true)) {
            return;
        }

        $complaints = Complaint::query()
            ->forOrganization($user->organization_id)
            ->where('submitted_by_user_id', $user->id)
            ->whereIn('status', ['acknowledged', 'in_progress', 'waiting_on_submitter', 'resolved'])
            ->orderByDesc('last_activity_at')
            ->limit(10)
            ->get();

        $meta = $user->profile_meta ?? [];
        $readIds = $meta['read_complaint_ids'] ?? [];

        foreach ($complaints as $complaint) {
            $notificationId = "complaint:{$complaint->id}:{$complaint->status}";
            if (! in_array($notificationId, $readIds, true)) {
                $readIds[] = $notificationId;
            }
        }

        $meta['read_complaint_ids'] = array_values($readIds);
        $user->update(['profile_meta' => $meta]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function assigneeOptions(string $orgId): array
    {
        return User::query()
            ->where('organization_id', $orgId)
            ->whereIn('role', self::STAFF_ROLES)
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'role'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => trim("{$u->first_name} {$u->last_name}"),
                'role' => $u->role,
            ])
            ->all();
    }

    private function formatUpdate(ComplaintUpdate $update): array
    {
        return [
            'id' => $update->id,
            'type' => $update->type,
            'body' => $update->body,
            'is_internal' => $update->is_internal,
            'metadata' => $update->metadata,
            'created_at' => $update->created_at?->toIso8601String(),
            'author' => $update->user ? [
                'id' => $update->user->id,
                'name' => trim("{$update->user->first_name} {$update->user->last_name}"),
                'role' => $update->user->role,
            ] : ['id' => null, 'name' => 'System', 'role' => 'system'],
        ];
    }

    private function recordUpdate(
        Complaint $complaint,
        ?User $user,
        string $type,
        string $body,
        bool $internal,
        ?array $metadata = null,
    ): ComplaintUpdate {
        return ComplaintUpdate::create([
            'complaint_id' => $complaint->id,
            'user_id' => $user?->id,
            'type' => $type,
            'body' => $body,
            'is_internal' => $internal,
            'metadata' => $metadata,
        ]);
    }

    private function nextReferenceNumber(string $orgId): string
    {
        $year = now()->format('Y');
        $prefix = "CMP-{$year}-";
        $latest = Complaint::forOrganization($orgId)
            ->where('reference_number', 'like', "{$prefix}%")
            ->orderByDesc('reference_number')
            ->value('reference_number');

        $seq = $latest ? ((int) substr($latest, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertRelatedEntities(User $user, array $data): void
    {
        $orgId = $user->organization_id;

        if (! empty($data['student_id'])) {
            $allowed = $this->parentStudentIds($user);
            if ($user->role !== 'parent' || ! in_array($data['student_id'], $allowed, true)) {
                throw ValidationException::withMessages(['student_id' => ['Invalid student selection.']]);
            }
            Student::where('organization_id', $orgId)->where('id', $data['student_id'])->firstOrFail();
        }

        if (! empty($data['route_id'])) {
            if ($user->role !== 'driver') {
                throw ValidationException::withMessages(['route_id' => ['Routes can only be linked by drivers.']]);
            }
            Route::forOrganization($orgId)->where('id', $data['route_id'])->firstOrFail();
        }

        if (! empty($data['school_id'])) {
            School::forOrganization($orgId)->where('id', $data['school_id'])->firstOrFail();
        }
    }

    /** @return array<int, string> */
    private function parentStudentIds(User $user): array
    {
        $accountId = ParentAccount::where('user_id', $user->id)->value('id');
        if (! $accountId) {
            return [];
        }

        return ParentStudent::where('parent_account_id', $accountId)->pluck('student_id')->all();
    }

    private function assertStaff(User $user): void
    {
        if (! in_array($user->role, self::STAFF_ROLES, true)) {
            abort(403, 'Only administrators can manage complaints.');
        }
    }

    private function assertSameOrg(User $user, Complaint $complaint): void
    {
        if ($user->organization_id !== $complaint->organization_id) {
            abort(404);
        }
    }

    private function assertCanViewAsSubmitter(User $user, Complaint $complaint): void
    {
        if ($complaint->submitted_by_user_id !== $user->id) {
            abort(403, 'You can only update your own complaints.');
        }
    }

    private function assertValidStatusTransition(string $from, string $to, bool $staff): void
    {
        $allowed = [
            'submitted' => ['acknowledged', 'in_progress', 'rejected', 'closed'],
            'acknowledged' => ['in_progress', 'waiting_on_submitter', 'resolved', 'rejected', 'closed'],
            'in_progress' => ['waiting_on_submitter', 'resolved', 'rejected', 'closed'],
            'waiting_on_submitter' => ['in_progress', 'resolved', 'closed'],
            'resolved' => ['closed', 'in_progress'],
            'closed' => ['in_progress'],
            'rejected' => ['closed'],
        ];

        if (! in_array($to, $allowed[$from] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot change status from {$from} to {$to}."],
            ]);
        }

        if (! $staff && ! in_array($to, ['closed'], true)) {
            abort(403);
        }
    }

    private function applyStatusTimestamps(Complaint $complaint, string $status): void
    {
        if ($status === 'acknowledged' && ! $complaint->acknowledged_at) {
            $complaint->acknowledged_at = now();
        }
        if ($status === 'resolved') {
            $complaint->resolved_at = now();
        }
        if ($status === 'closed') {
            $complaint->closed_at = now();
        }
    }
}
