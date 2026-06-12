<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\MobileChatConversation;
use App\Models\MobileChatMessage;
use App\Models\ParentAccount;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MobileChatService
{
    public function __construct(private readonly ExpoPushService $push)
    {
    }

    public function ensureConversations(User $user): void
    {
        if ($user->hasRole('driver')) {
            $this->ensureDriverSupport($user);
            $this->ensureDriverParentThreads($user);
            $this->ensureDriverSchoolThreads($user);
        }

        if ($user->hasRole('parent')) {
            $this->ensureParentThreads($user);
        }
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listForUser(User $user): Collection
    {
        $this->ensureConversations($user);

        $organizationId = $this->resolveOrganizationId($user);
        if (! $organizationId) {
            return collect();
        }

        return MobileChatConversation::query()
            ->where('organization_id', $organizationId)
            ->where(function ($query) use ($user) {
                $query->whereJsonContains('participant_user_ids', $user->id)
                    ->orWhereJsonContains('participant_user_ids', (string) $user->id);
            })
            ->orderByDesc('last_message_at')
            ->get()
            ->filter(fn (MobileChatConversation $c) => $this->isVisibleToUser($c, $user))
            ->map(fn (MobileChatConversation $c) => $this->conversationPayload($c, $user))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listForStaff(User $staff): Collection
    {
        return MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn (MobileChatConversation $c) => $this->staffConversationPayload($c, $staff))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listForSchoolContact(User $staff): Collection
    {
        if (! $staff->school_id) {
            return collect();
        }

        $schoolThreads = MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->whereIn('type', ['parent_school', 'driver_school'])
            ->where('metadata->school_id', $staff->school_id)
            ->orderByDesc('last_message_at')
            ->get();

        $transportThreads = MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->where('type', 'staff_direct')
            ->whereJsonContains('participant_user_ids', $staff->id)
            ->orderByDesc('last_message_at')
            ->get();

        return $schoolThreads
            ->concat($transportThreads)
            ->sortByDesc(fn (MobileChatConversation $c) => $c->last_message_at?->timestamp ?? 0)
            ->values()
            ->map(fn (MobileChatConversation $c) => $this->staffConversationPayload($c, $staff))
            ->values();
    }

    public function authorizeConversation(User $user, MobileChatConversation $conversation): void
    {
        if ($conversation->organization_id !== $user->organization_id) {
            abort(403);
        }

        if (in_array($user->role, ['admin', 'dispatcher'], true)) {
            return;
        }

        if ($user->role === 'school_contact') {
            if ($conversation->type === 'staff_direct') {
                if (! in_array($user->id, $conversation->participant_user_ids ?? [], true)) {
                    abort(403);
                }

                return;
            }

            if (! in_array($conversation->type, ['parent_school', 'driver_school'], true)) {
                abort(403);
            }
            if (($conversation->metadata['school_id'] ?? null) !== $user->school_id) {
                abort(403);
            }

            return;
        }

        if (! in_array($user->id, $conversation->participant_user_ids ?? [], true)) {
            abort(403, 'You are not a participant in this conversation.');
        }
    }

    public function sendMessage(User $user, MobileChatConversation $conversation, string $body): MobileChatMessage
    {
        $this->authorizeConversation($user, $conversation);

        $body = trim($body);
        if ($body === '') {
            abort(422, 'Message body is required.');
        }

        $message = MobileChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $user->id,
            'body' => $body,
        ]);

        $conversation->update(['last_message_at' => now()]);

        $message->load('sender:id,first_name,last_name,role');
        $this->notifyMessageRecipients($conversation, $message, $user);

        return $message;
    }

    private function notifyMessageRecipients(
        MobileChatConversation $conversation,
        MobileChatMessage $message,
        User $sender,
    ): void {
        $recipientIds = collect($conversation->participant_user_ids ?? [])
            ->filter(fn (string $id) => $id !== $sender->id)
            ->values();

        if ($recipientIds->isEmpty()) {
            return;
        }

        $senderName = trim("{$sender->first_name} {$sender->last_name}") ?: 'New message';

        User::query()
            ->whereIn('id', $recipientIds)
            ->get()
            ->each(function (User $recipient) use ($conversation, $message, $sender, $senderName) {
                if (! $this->pushEnabledForUser($recipient)) {
                    return;
                }

                [$title] = $this->resolveConversationDisplay($conversation, $recipient);

                $this->push->sendToUser($recipient, [
                    'title' => $senderName,
                    'body' => Str::limit($message->body, 160),
                    'data' => [
                        'type' => 'chat_message',
                        'click_action' => 'open_chat',
                        'conversation_id' => $conversation->id,
                        'thread_title' => $title,
                    ],
                ]);
            });
    }

    private function pushEnabledForUser(User $user): bool
    {
        if ($user->role === 'parent') {
            $account = ParentAccount::query()->where('user_id', $user->id)->first();
            $prefs = $account?->notification_preferences ?? [];

            return ($prefs['push'] ?? true) === true;
        }

        $prefs = $user->profile_meta['notification_preferences'] ?? [];

        return ($prefs['push'] ?? true) === true;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function notificationItemsForUser(User $user, bool $includeRead = false): array
    {
        $this->ensureConversations($user);
        $items = [];

        $conversations = MobileChatConversation::query()
            ->where('organization_id', $user->organization_id)
            ->whereJsonContains('participant_user_ids', $user->id)
            ->orderByDesc('last_message_at')
            ->get()
            ->filter(fn (MobileChatConversation $c) => $this->isVisibleToUser($c, $user));

        foreach ($conversations as $conversation) {
            $lastIncoming = $conversation->messages()
                ->where('sender_user_id', '!=', $user->id)
                ->with('sender:id,first_name,last_name')
                ->latest()
                ->first();

            if (! $lastIncoming) {
                continue;
            }

            $unreadQuery = $conversation->messages()->where('sender_user_id', '!=', $user->id);
            $lastRead = $this->lastReadAt($user, $conversation->id);
            if ($lastRead) {
                $unreadQuery->where('created_at', '>', $lastRead);
            }
            $unread = $unreadQuery->count();
            $read = $unread === 0;

            if (! $includeRead && $read) {
                continue;
            }

            [$title] = $this->resolveConversationDisplay($conversation, $user);
            $senderName = $lastIncoming->sender
                ? trim("{$lastIncoming->sender->first_name} {$lastIncoming->sender->last_name}")
                : 'Someone';

            $items[] = [
                'id' => 'chat:'.$conversation->id,
                'category' => 'message',
                'severity' => 'info',
                'title' => $read
                    ? "Message · {$title}"
                    : ($unread > 1 ? "{$unread} new messages · {$title}" : "New message from {$senderName}"),
                'message' => Str::limit($lastIncoming->body, 120),
                'time' => $lastIncoming->created_at->toIso8601String(),
                'read' => $read,
                'conversation_id' => $conversation->id,
            ];
        }

        return $items;
    }

    public function markChatNotificationRead(User $user, string $notificationId): bool
    {
        if (! str_starts_with($notificationId, 'chat:')) {
            return false;
        }

        $conversationId = substr($notificationId, 5);
        $conversation = MobileChatConversation::query()->find($conversationId);
        if (! $conversation) {
            return false;
        }

        $this->authorizeConversation($user, $conversation);
        $this->markConversationRead($user, $conversation);

        return true;
    }

    public function markAllConversationsRead(User $user): void
    {
        $this->ensureConversations($user);

        MobileChatConversation::query()
            ->where('organization_id', $user->organization_id)
            ->whereJsonContains('participant_user_ids', $user->id)
            ->get()
            ->filter(fn (MobileChatConversation $c) => $this->isVisibleToUser($c, $user))
            ->each(fn (MobileChatConversation $c) => $this->markConversationRead($user, $c));
    }

    /**
     * @return array<string, mixed>
     */
    public function markConversationRead(User $user, MobileChatConversation $conversation): void
    {
        $meta = $user->profile_meta ?? [];
        $reads = $meta['chat_last_read'] ?? [];
        $reads[$conversation->id] = now()->toIso8601String();
        $meta['chat_last_read'] = $reads;
        $user->update(['profile_meta' => $meta]);
        $user->profile_meta = $meta;
    }

    public function conversationPayload(MobileChatConversation $conversation, User $user): array
    {
        $last = $conversation->messages()->latest()->first();
        $unreadQuery = $conversation->messages()
            ->where('sender_user_id', '!=', $user->id);

        $lastRead = $this->lastReadAt($user, $conversation->id);
        if ($lastRead) {
            $unreadQuery->where('created_at', '>', $lastRead);
        }

        $unread = $unreadQuery->count();

        [$title, $subtitle, $avatarType] = $this->resolveConversationDisplay($conversation, $user);

        $metadata = $conversation->metadata ?? [];

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'title' => $title,
            'subtitle' => $subtitle,
            'avatar_type' => $avatarType,
            'participants' => $this->participantSummaries($conversation),
            'student_id' => $metadata['student_id'] ?? null,
            'school_id' => $metadata['school_id'] ?? null,
            'last_message' => $last ? [
                'body' => Str::limit($last->body, 80),
                'time' => $last->created_at->toIso8601String(),
                'is_mine' => $last->sender_user_id === $user->id,
                'sender_name' => $last->sender ? trim("{$last->sender->first_name} {$last->sender->last_name}") : 'System',
            ] : null,
            'unread_count' => min($unread, 9),
            'updated_at' => ($conversation->last_message_at ?? $conversation->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function staffConversationPayload(MobileChatConversation $conversation, ?User $staff = null): array
    {
        $last = $conversation->messages()->latest()->first();
        $metadata = $conversation->metadata ?? [];
        $unread = 0;

        if ($staff) {
            $unreadQuery = $conversation->messages()->where('sender_user_id', '!=', $staff->id);
            $lastRead = $this->lastReadAt($staff, $conversation->id);
            if ($lastRead) {
                $unreadQuery->where('created_at', '>', $lastRead);
            }
            $unread = min($unreadQuery->count(), 99);
        }

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'title' => $this->staffConversationTitle($conversation, $staff),
            'subtitle' => $metadata['subtitle'] ?? null,
            'participants' => $this->participantSummaries($conversation),
            'last_message' => $last ? [
                'body' => Str::limit($last->body, 120),
                'time' => $last->created_at->toIso8601String(),
                'sender_name' => $last->sender ? trim("{$last->sender->first_name} {$last->sender->last_name}") : 'System',
            ] : null,
            'unread_count' => $unread,
            'updated_at' => ($conversation->last_message_at ?? $conversation->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function messagePayload(MobileChatMessage $message, ?string $viewerUserId = null): array
    {
        $viewerUserId ??= auth()->id();
        $sender = $message->sender;

        return [
            'id' => $message->id,
            'body' => $message->body,
            'is_system' => $message->is_system,
            'is_mine' => $viewerUserId === $message->sender_user_id,
            'time' => $message->created_at->toIso8601String(),
            'sender' => $sender ? [
                'id' => $sender->id,
                'name' => trim("{$sender->first_name} {$sender->last_name}"),
                'role' => $sender->role,
            ] : [
                'id' => null,
                'name' => 'System',
                'role' => 'system',
            ],
        ];
    }

    private function lastReadAt(User $user, string $conversationId): ?Carbon
    {
        $raw = $user->profile_meta['chat_last_read'][$conversationId] ?? null;

        return $raw ? Carbon::parse($raw) : null;
    }

    private function isVisibleToUser(MobileChatConversation $conversation, User $user): bool
    {
        if (! $user->hasRole('driver') || $conversation->type !== 'parent_driver') {
            return true;
        }

        $other = $this->otherParticipantUser($conversation, $user);

        return $other !== null && $other->id !== $user->id && $other->hasRole('parent');
    }

    private function resolveOrganizationId(User $user): ?string
    {
        if ($user->organization_id) {
            return $user->organization_id;
        }

        if ($user->hasRole('driver')) {
            return Driver::query()->where('user_id', $user->id)->value('organization_id');
        }

        if ($user->hasRole('parent')) {
            return ParentAccount::query()->where('user_id', $user->id)->value('organization_id');
        }

        return null;
    }

    private function ensureDriverSupport(User $user): void
    {
        $organizationId = $this->resolveOrganizationId($user);
        if (! $organizationId) {
            return;
        }

        $exists = MobileChatConversation::query()
            ->where('organization_id', $organizationId)
            ->where('type', 'driver_support')
            ->where(function ($query) use ($user) {
                $query->whereJsonContains('participant_user_ids', $user->id)
                    ->orWhereJsonContains('participant_user_ids', (string) $user->id);
            })
            ->exists();

        if ($exists) {
            return;
        }

        $dispatch = $this->findDispatchUser($organizationId);
        $participants = array_values(array_unique(array_filter([$user->id, $dispatch?->id])));

        $conversation = MobileChatConversation::create([
            'organization_id' => $organizationId,
            'type' => 'driver_support',
            'title' => 'Dispatch & Support',
            'participant_user_ids' => $participants,
            'metadata' => [
                'subtitle' => 'Route help, delays, and app support',
                'avatar_type' => 'support',
            ],
            'last_message_at' => now(),
        ]);

        $this->seedWelcome($conversation, $dispatch, 'Welcome to FleetPilot driver support. Message us about routes, delays, or technical issues.');
    }

    private function ensureDriverParentThreads(User $user): void
    {
        $driver = Driver::where('user_id', $user->id)->first();
        if (! $driver) {
            return;
        }

        $students = Student::query()
            ->where('assigned_driver_id', $driver->id)
            ->with(['parentAccounts.user'])
            ->get();

        foreach ($students as $student) {
            foreach ($student->parentAccounts as $account) {
                if (! $account->user_id || ! $account->user) {
                    continue;
                }

                $this->ensureParentDriverConversation(
                    organizationId: $this->resolveOrganizationId($user) ?? $driver->organization_id,
                    parentUser: $account->user,
                    driver: $driver,
                    student: $student,
                );
            }
        }
    }

    private function ensureDriverSchoolThreads(User $user): void
    {
        $driver = Driver::where('user_id', $user->id)->first();
        if (! $driver) {
            return;
        }

        $organizationId = $this->resolveOrganizationId($user) ?? $driver->organization_id;
        if (! $organizationId) {
            return;
        }

        $schoolIds = Student::query()
            ->where('assigned_driver_id', $driver->id)
            ->whereNotNull('school_id')
            ->pluck('school_id')
            ->unique()
            ->filter();

        foreach (School::query()->whereIn('id', $schoolIds)->get() as $school) {
            $conversation = MobileChatConversation::query()
                ->where('organization_id', $organizationId)
                ->where('type', 'driver_school')
                ->whereJsonContains('participant_user_ids', $user->id)
                ->where('metadata->school_id', $school->id)
                ->first();

            $liaison = User::query()
                ->where('organization_id', $organizationId)
                ->where('school_id', $school->id)
                ->where('role', 'school_contact')
                ->where('is_active', true)
                ->first();

            if ($conversation) {
                if ($liaison && ! in_array($liaison->id, $conversation->participant_user_ids ?? [], true)) {
                    $participants = array_values(array_unique([
                        ...($conversation->participant_user_ids ?? []),
                        $liaison->id,
                    ]));
                    $conversation->update(['participant_user_ids' => $participants]);
                }

                continue;
            }

            $participants = array_values(array_unique(array_filter([
                $user->id,
                $liaison?->id,
            ])));

            $conversation = MobileChatConversation::create([
                'organization_id' => $organizationId,
                'type' => 'driver_school',
                'title' => $school->name,
                'participant_user_ids' => $participants ?: [$user->id],
                'metadata' => [
                    'subtitle' => 'School transportation office',
                    'school_id' => $school->id,
                    'driver_id' => $driver->id,
                    'avatar_type' => 'school',
                ],
                'last_message_at' => now()->subHours(3),
            ]);

            $this->seedWelcome(
                $conversation,
                $liaison,
                "Hello from {$school->name}. Message us about student pickups, dismissals, or route changes.",
            );
        }
    }

    private function ensureParentThreads(User $user): void
    {
        $organizationId = $this->resolveOrganizationId($user);
        if (! $organizationId) {
            return;
        }

        $account = ParentAccount::where('user_id', $user->id)->first();
        $students = $account
            ? Student::query()->whereIn('id', function ($q) use ($account) {
                $q->select('student_id')->from('parent_students')->where('parent_account_id', $account->id);
            })->with(['assignedDriver.user', 'school'])->get()
            : collect();

        foreach ($students as $student) {
            $driver = $student->assignedDriver;
            if ($driver?->user_id) {
                $this->ensureParentDriverConversation(
                    organizationId: $organizationId,
                    parentUser: $user,
                    driver: $driver,
                    student: $student,
                );
            }
        }

        $schools = $students->pluck('school')->filter()->unique('id');
        foreach ($schools as $school) {
            if (! $school instanceof School) {
                continue;
            }

            $conversation = MobileChatConversation::query()
                ->where('organization_id', $organizationId)
                ->where('type', 'parent_school')
                ->whereJsonContains('participant_user_ids', $user->id)
                ->where('metadata->school_id', $school->id)
                ->first();

            $liaison = User::query()
                ->where('organization_id', $organizationId)
                ->where('school_id', $school->id)
                ->where('role', 'school_contact')
                ->where('is_active', true)
                ->first();

            if ($conversation) {
                if ($liaison && ! in_array($liaison->id, $conversation->participant_user_ids ?? [], true)) {
                    $participants = array_values(array_unique([
                        ...($conversation->participant_user_ids ?? []),
                        $liaison->id,
                    ]));
                    $conversation->update(['participant_user_ids' => $participants]);
                }

                continue;
            }

            $participants = array_values(array_unique(array_filter([
                $user->id,
                $liaison?->id,
            ])));

            $conversation = MobileChatConversation::create([
                'organization_id' => $organizationId,
                'type' => 'parent_school',
                'title' => $school->name,
                'participant_user_ids' => $participants ?: [$user->id],
                'metadata' => [
                    'subtitle' => 'School transportation office',
                    'school_id' => $school->id,
                    'avatar_type' => 'school',
                ],
                'last_message_at' => now()->subHours(2),
            ]);

            $this->seedWelcome($conversation, $liaison, "Hello from {$school->name} transportation. We're here for enrollment and route changes.");
        }

        $supportExists = MobileChatConversation::query()
            ->where('organization_id', $organizationId)
            ->where('type', 'parent_support')
            ->whereJsonContains('participant_user_ids', $user->id)
            ->exists();

        if (! $supportExists) {
            $legacy = MobileChatConversation::query()
                ->where('organization_id', $organizationId)
                ->where('type', 'driver_support')
                ->whereJsonContains('participant_user_ids', $user->id)
                ->first();

            if ($legacy) {
                $legacy->update([
                    'type' => 'parent_support',
                    'title' => 'Transportation office',
                    'metadata' => array_merge($legacy->metadata ?? [], [
                        'subtitle' => 'Dispatch & route help',
                        'avatar_type' => 'support',
                    ]),
                ]);
            } else {
                $dispatch = $this->findDispatchUser($organizationId);

                $conversation = MobileChatConversation::create([
                    'organization_id' => $organizationId,
                    'type' => 'parent_support',
                    'title' => 'Transportation office',
                    'participant_user_ids' => array_values(array_filter([$user->id, $dispatch?->id])),
                    'metadata' => [
                        'subtitle' => 'Dispatch & route help',
                        'avatar_type' => 'support',
                    ],
                    'last_message_at' => now()->subDay(),
                ]);

                $this->seedWelcome($conversation, $dispatch, 'How can transportation help you today?');
            }
        }
    }

    private function ensureParentDriverConversation(
        string $organizationId,
        User $parentUser,
        Driver $driver,
        Student $student,
    ): void {
        $exists = MobileChatConversation::query()
            ->where('organization_id', $organizationId)
            ->where('type', 'parent_driver')
            ->where('metadata->student_id', $student->id)
            ->exists();

        if ($exists) {
            return;
        }

        $conversation = MobileChatConversation::create([
            'organization_id' => $organizationId,
            'type' => 'parent_driver',
            'title' => trim("{$driver->first_name} {$driver->last_name}"),
            'participant_user_ids' => array_values(array_filter([$parentUser->id, $driver->user_id])),
            'metadata' => [
                'subtitle' => "Bus driver · {$driver->employee_id}",
                'driver_subtitle' => "Bus driver · {$driver->employee_id}",
                'parent_subtitle' => 'Parent · '.trim("{$student->first_name} {$student->last_name}"),
                'driver_id' => $driver->id,
                'parent_user_id' => $parentUser->id,
                'student_id' => $student->id,
                'avatar_type' => 'driver',
            ],
            'last_message_at' => now()->subMinutes(30),
        ]);

        MobileChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $driver->user_id,
            'body' => 'Hi! Feel free to message me about pickup times or route questions.',
        ]);
    }

    private function seedWelcome(MobileChatConversation $conversation, ?User $sender, string $body): void
    {
        MobileChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $sender?->id,
            'body' => $body,
            'is_system' => $sender === null,
        ]);
    }

    private function findDispatchUser(string $organizationId): ?User
    {
        return User::query()
            ->where('organization_id', $organizationId)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN role = 'dispatcher' THEN 0 ELSE 1 END")
            ->first();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listMessageableContacts(User $staff): array
    {
        $orgId = $staff->organization_id;
        $contacts = [];

        $append = function (User $user, string $subtitle, ?string $conversationId = null) use (&$contacts, $staff): void {
            if ($user->id === $staff->id || ! $user->is_active) {
                return;
            }

            $contacts[$user->id] = [
                'user_id' => $user->id,
                'name' => trim("{$user->first_name} {$user->last_name}"),
                'role' => $user->role,
                'subtitle' => $subtitle,
                'conversation_id' => $conversationId,
            ];
        };

        Driver::forOrganization($orgId)
            ->with('user:id,first_name,last_name,role,is_active,email')
            ->whereNotNull('user_id')
            ->orderBy('last_name')
            ->get()
            ->each(function (Driver $driver) use ($append) {
                if (! $driver->user) {
                    return;
                }
                $append(
                    $driver->user,
                    trim(($driver->employee_id ? "Driver · {$driver->employee_id}" : 'Driver').($driver->status !== 'active' ? ' · inactive' : '')),
                    $this->existingStaffConversationId($driver->user, 'driver_support'),
                );
            });

        ParentAccount::query()
            ->where('organization_id', $orgId)
            ->with('user:id,first_name,last_name,role,is_active,email')
            ->withCount('students')
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->orderBy('id')
            ->get()
            ->each(function (ParentAccount $account) use ($append) {
                if (! $account->user) {
                    return;
                }
                $append(
                    $account->user,
                    'Parent · '.((int) $account->students_count).' linked student(s)',
                    $this->existingStaffConversationId($account->user, 'staff_direct'),
                );
            });

        User::query()
            ->where('organization_id', $orgId)
            ->where('role', 'school_contact')
            ->where('is_active', true)
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'role', 'is_active', 'school_id'])
            ->each(function (User $user) use ($append, $orgId) {
                $school = $user->school_id ? School::query()->find($user->school_id) : null;
                $append(
                    $user,
                    $school ? "School · {$school->name}" : 'School contact',
                    $this->existingStaffConversationId($user, 'staff_direct'),
                );
            });

        User::query()
            ->where('organization_id', $orgId)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'role', 'is_active'])
            ->each(function (User $user) use ($append, $staff) {
                if ($user->id === $staff->id) {
                    return;
                }
                $append(
                    $user,
                    ucfirst(str_replace('_', ' ', $user->role)),
                    $this->existingStaffConversationId($user, 'staff_direct'),
                );
            });

        return collect($contacts)
            ->sortBy([['role', 'asc'], ['name', 'asc']])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listMessageableContactsForSchoolContact(User $staff): array
    {
        if (! $staff->school_id) {
            return [];
        }

        $orgId = $staff->organization_id;
        $schoolId = $staff->school_id;
        $school = School::query()->find($schoolId);
        $contacts = [];

        $append = function (User $user, string $subtitle, ?string $conversationId = null) use (&$contacts, $staff): void {
            if ($user->id === $staff->id || ! $user->is_active) {
                return;
            }

            $contacts[$user->id] = [
                'user_id' => $user->id,
                'name' => trim("{$user->first_name} {$user->last_name}"),
                'role' => $user->role,
                'subtitle' => $subtitle,
                'conversation_id' => $conversationId,
            ];
        };

        ParentAccount::query()
            ->where('organization_id', $orgId)
            ->with('user:id,first_name,last_name,role,is_active,email')
            ->withCount(['students as school_students_count' => fn ($q) => $q->where('school_id', $schoolId)])
            ->where(function ($q) use ($schoolId) {
                $q->whereHas('students', fn ($student) => $student->where('school_id', $schoolId))
                    ->orDoesntHave('students');
            })
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->get()
            ->each(function (ParentAccount $account) use ($append, $school) {
                if (! $account->user) {
                    return;
                }

                $count = (int) $account->school_students_count;
                $append(
                    $account->user,
                    $count > 0
                        ? "Parent · {$count} student(s) at {$school?->name}"
                        : 'Parent · no students linked yet',
                    $this->existingSchoolConversationId($account->user, 'parent_school', $school?->id),
                );
            });

        $driverIds = Student::query()
            ->where('organization_id', $orgId)
            ->where('school_id', $schoolId)
            ->whereNotNull('assigned_driver_id')
            ->pluck('assigned_driver_id')
            ->unique()
            ->filter();

        Driver::forOrganization($orgId)
            ->with('user:id,first_name,last_name,role,is_active,email')
            ->whereIn('id', $driverIds)
            ->whereNotNull('user_id')
            ->orderBy('last_name')
            ->get()
            ->each(function (Driver $driver) use ($append, $school) {
                if (! $driver->user) {
                    return;
                }

                $append(
                    $driver->user,
                    trim(($driver->employee_id ? "Driver · {$driver->employee_id}" : 'Driver')." · {$school?->name}"),
                    $this->existingSchoolConversationId($driver->user, 'driver_school', $school?->id),
                );
            });

        User::query()
            ->where('organization_id', $orgId)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'role', 'is_active'])
            ->each(function (User $user) use ($append, $staff) {
                $append(
                    $user,
                    $user->role === 'dispatcher' ? 'Transportation · Dispatch' : 'Transportation · Admin',
                    $this->existingStaffConversationId($user, 'staff_direct'),
                );
            });

        return collect($contacts)
            ->sortBy([['role', 'asc'], ['name', 'asc']])
            ->values()
            ->all();
    }

    public function findOrCreateSchoolContactConversation(User $staff, string $targetUserId): MobileChatConversation
    {
        if ($staff->role !== 'school_contact' || ! $staff->school_id) {
            abort(403);
        }

        $target = User::query()->findOrFail($targetUserId);

        if ($target->organization_id !== $staff->organization_id || $target->id === $staff->id) {
            abort(403);
        }

        if ($target->role === 'parent') {
            return $this->findOrCreateParentSchoolThread($staff, $target);
        }

        if ($target->role === 'driver') {
            return $this->findOrCreateDriverSchoolThread($staff, $target);
        }

        if (in_array($target->role, ['admin', 'dispatcher'], true)) {
            return $this->findOrCreateStaffConversation($staff, $target);
        }

        abort(422, 'You cannot start a conversation with this contact.');
    }

    private function findOrCreateParentSchoolThread(User $staff, User $parentUser): MobileChatConversation
    {
        $school = School::query()->findOrFail($staff->school_id);

        $existing = MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->where('type', 'parent_school')
            ->whereJsonContains('participant_user_ids', $parentUser->id)
            ->where('metadata->school_id', $school->id)
            ->first();

        if ($existing) {
            $participants = array_values(array_unique([
                ...($existing->participant_user_ids ?? []),
                $staff->id,
            ]));
            if ($participants !== $existing->participant_user_ids) {
                $existing->update(['participant_user_ids' => $participants]);
            }

            return $existing->fresh();
        }

        $conversation = MobileChatConversation::create([
            'organization_id' => $staff->organization_id,
            'type' => 'parent_school',
            'title' => $school->name,
            'participant_user_ids' => [$parentUser->id, $staff->id],
            'metadata' => [
                'subtitle' => 'School transportation office',
                'school_id' => $school->id,
                'avatar_type' => 'school',
            ],
            'last_message_at' => now(),
        ]);

        $this->seedWelcome(
            $conversation,
            $staff,
            "Hello from {$school->name}. Message us about enrollment, pickups, or route changes.",
        );

        return $conversation;
    }

    private function findOrCreateDriverSchoolThread(User $staff, User $driverUser): MobileChatConversation
    {
        $school = School::query()->findOrFail($staff->school_id);
        $driver = Driver::where('user_id', $driverUser->id)->first();

        $existing = MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->where('type', 'driver_school')
            ->whereJsonContains('participant_user_ids', $driverUser->id)
            ->where('metadata->school_id', $school->id)
            ->first();

        if ($existing) {
            $participants = array_values(array_unique([
                ...($existing->participant_user_ids ?? []),
                $staff->id,
            ]));
            if ($participants !== $existing->participant_user_ids) {
                $existing->update(['participant_user_ids' => $participants]);
            }

            return $existing->fresh();
        }

        $conversation = MobileChatConversation::create([
            'organization_id' => $staff->organization_id,
            'type' => 'driver_school',
            'title' => $school->name,
            'participant_user_ids' => [$driverUser->id, $staff->id],
            'metadata' => [
                'subtitle' => 'School transportation office',
                'school_id' => $school->id,
                'driver_id' => $driver?->id,
                'avatar_type' => 'school',
            ],
            'last_message_at' => now(),
        ]);

        $this->seedWelcome(
            $conversation,
            $staff,
            "Hello from {$school->name}. Message us about student pickups, dismissals, or route changes.",
        );

        return $conversation;
    }

    private function existingSchoolConversationId(User $user, string $type, ?string $schoolId): ?string
    {
        if (! $schoolId) {
            return null;
        }

        return MobileChatConversation::query()
            ->where('type', $type)
            ->whereJsonContains('participant_user_ids', $user->id)
            ->where('metadata->school_id', $schoolId)
            ->value('id');
    }

    public function findOrCreateStaffConversation(User $staff, string $targetUserId): MobileChatConversation
    {
        $target = User::query()->findOrFail($targetUserId);

        if ($target->organization_id !== $staff->organization_id) {
            abort(403);
        }

        if ($target->id === $staff->id) {
            abort(422, 'You cannot start a conversation with yourself.');
        }

        if ($target->role === 'driver') {
            return $this->findOrCreateDriverSupportForStaff($staff, $target);
        }

        $existing = MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->where('type', 'staff_direct')
            ->whereJsonContains('participant_user_ids', $staff->id)
            ->whereJsonContains('participant_user_ids', $target->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        return MobileChatConversation::create([
            'organization_id' => $staff->organization_id,
            'type' => 'staff_direct',
            'title' => trim("{$target->first_name} {$target->last_name}"),
            'participant_user_ids' => [$staff->id, $target->id],
            'metadata' => [
                'subtitle' => ucfirst(str_replace('_', ' ', $target->role)),
                'target_user_id' => $target->id,
                'avatar_type' => $target->role,
            ],
            'last_message_at' => now(),
        ]);
    }

    private function findOrCreateDriverSupportForStaff(User $staff, User $driverUser): MobileChatConversation
    {
        $existing = MobileChatConversation::query()
            ->where('organization_id', $staff->organization_id)
            ->where('type', 'driver_support')
            ->whereJsonContains('participant_user_ids', $driverUser->id)
            ->first();

        if ($existing) {
            $participants = $existing->participant_user_ids ?? [];
            if (! in_array($staff->id, $participants, true)) {
                $participants[] = $staff->id;
                $existing->update(['participant_user_ids' => array_values(array_unique($participants))]);
            }

            return $existing->fresh();
        }

        $conversation = MobileChatConversation::create([
            'organization_id' => $staff->organization_id,
            'type' => 'driver_support',
            'title' => 'Dispatch & Support',
            'participant_user_ids' => array_values(array_unique([$driverUser->id, $staff->id])),
            'metadata' => [
                'subtitle' => 'Route help, delays, and app support',
                'avatar_type' => 'support',
            ],
            'last_message_at' => now(),
        ]);

        $this->seedWelcome($conversation, $staff, 'Hi — dispatch is here if you need route or schedule help.');

        return $conversation;
    }

    private function existingStaffConversationId(User $target, string $preferredType): ?string
    {
        if ($target->role === 'driver') {
            $conversation = MobileChatConversation::query()
                ->where('organization_id', $target->organization_id)
                ->where('type', 'driver_support')
                ->whereJsonContains('participant_user_ids', $target->id)
                ->first();

            return $conversation?->id;
        }

        if ($target->role === 'parent') {
            $conversation = MobileChatConversation::query()
                ->where('organization_id', $target->organization_id)
                ->where('type', 'parent_support')
                ->whereJsonContains('participant_user_ids', $target->id)
                ->first();

            if ($conversation) {
                return $conversation->id;
            }
        }

        $conversation = MobileChatConversation::query()
            ->where('organization_id', $target->organization_id)
            ->where('type', 'staff_direct')
            ->whereJsonContains('participant_user_ids', $target->id)
            ->first();

        return $conversation?->id;
    }

    /**
     * @return array{0: string, 1: ?string, 2: string}
     */
    private function resolveConversationDisplay(MobileChatConversation $conversation, User $user): array
    {
        $metadata = $conversation->metadata ?? [];

        if ($conversation->type === 'parent_driver') {
            if ($user->role === 'driver') {
                $parent = $this->otherParticipantUser($conversation, $user);
                if ($parent) {
                    $studentName = $this->studentNameForConversation($conversation, $metadata);

                    return [
                        trim("{$parent->first_name} {$parent->last_name}"),
                        $studentName ? "Parent · {$studentName}" : ($metadata['parent_subtitle'] ?? 'Parent'),
                        'parent',
                    ];
                }
            }

            if ($user->role === 'parent') {
                return [
                    $conversation->title,
                    $metadata['driver_subtitle'] ?? $metadata['subtitle'] ?? null,
                    'driver',
                ];
            }
        }

        if ($conversation->type === 'parent_support' && $user->role === 'parent') {
            return [
                $conversation->title,
                $metadata['subtitle'] ?? 'Dispatch & route help',
                'support',
            ];
        }

        if ($conversation->type === 'parent_school' && $user->role === 'parent') {
            return [
                $conversation->title,
                $metadata['subtitle'] ?? 'School transportation office',
                'school',
            ];
        }

        if ($conversation->type === 'driver_school' && $user->role === 'driver') {
            return [
                $conversation->title,
                $metadata['subtitle'] ?? 'School transportation office',
                'school',
            ];
        }

        if ($conversation->type === 'driver_support' && $user->role === 'driver') {
            return [
                $conversation->title,
                $metadata['subtitle'] ?? 'Route help, delays, and app support',
                'support',
            ];
        }

        return [
            $conversation->title,
            $metadata['subtitle'] ?? null,
            $metadata['avatar_type'] ?? 'support',
        ];
    }

    private function staffConversationTitle(MobileChatConversation $conversation, ?User $staff = null): string
    {
        if ($conversation->type === 'parent_driver') {
            $participants = $this->participantSummaries($conversation);
            $parent = collect($participants)->firstWhere('role', 'parent');
            $driver = collect($participants)->firstWhere('role', 'driver');

            if ($parent && $driver) {
                return "{$parent['name']} ↔ {$driver['name']}";
            }
        }

        if ($conversation->type === 'driver_support') {
            $driver = collect($this->participantSummaries($conversation))->firstWhere('role', 'driver');
            if ($driver) {
                return "{$driver['name']} · Driver support";
            }
        }

        if ($conversation->type === 'parent_support') {
            $parent = collect($this->participantSummaries($conversation))->firstWhere('role', 'parent');
            if ($parent) {
                return "{$parent['name']} · Transportation";
            }

            return 'Parent · Transportation office';
        }

        if ($conversation->type === 'driver_school') {
            $metadata = $conversation->metadata ?? [];
            $driver = collect($this->participantSummaries($conversation))->firstWhere('role', 'driver');
            $schoolName = $metadata['school_name'] ?? $conversation->title;
            if ($driver) {
                return "{$driver['name']} ↔ {$schoolName}";
            }

            return "Driver ↔ {$schoolName}";
        }

        if ($conversation->type === 'parent_school') {
            $parent = collect($this->participantSummaries($conversation))->firstWhere('role', 'parent');
            if ($parent) {
                return "{$parent['name']} ↔ {$conversation->title}";
            }
        }

        if ($conversation->type === 'staff_direct') {
            $participants = $this->participantSummaries($conversation);
            if ($staff) {
                $staffName = trim("{$staff->first_name} {$staff->last_name}");
                $other = collect($participants)->first(fn ($p) => $p['name'] !== $staffName);
                if ($other) {
                    return $other['name'];
                }
            }

            return collect($participants)->pluck('name')->join(' · ') ?: $conversation->title;
        }

        return $conversation->title;
    }

    /**
     * @return array<int, array{name: string, role: string}>
     */
    private function participantSummaries(MobileChatConversation $conversation): array
    {
        $users = User::query()
            ->whereIn('id', $conversation->participant_user_ids ?? [])
            ->get(['id', 'first_name', 'last_name', 'role']);

        return $users->map(fn (User $user) => [
            'name' => trim("{$user->first_name} {$user->last_name}"),
            'role' => $user->role,
        ])->values()->all();
    }

    private function otherParticipantUser(MobileChatConversation $conversation, User $user): ?User
    {
        $otherId = collect($conversation->participant_user_ids ?? [])
            ->first(fn ($id) => $id !== $user->id);

        return $otherId ? User::query()->find($otherId) : null;
    }

    private function studentNameForConversation(MobileChatConversation $conversation, array $metadata): ?string
    {
        if (! empty($metadata['student_id'])) {
            $student = Student::query()->find($metadata['student_id']);
            if ($student) {
                return trim("{$student->first_name} {$student->last_name}");
            }
        }

        $driver = Driver::query()->find($metadata['driver_id'] ?? null);
        if (! $driver) {
            return null;
        }

        $parentId = $metadata['parent_user_id'] ?? collect($conversation->participant_user_ids ?? [])
            ->first(fn ($id) => $id !== $driver->user_id);

        if (! $parentId) {
            return null;
        }

        $account = ParentAccount::where('user_id', $parentId)->first();
        if (! $account) {
            return null;
        }

        $student = Student::query()
            ->where('assigned_driver_id', $driver->id)
            ->whereIn('id', function ($q) use ($account) {
                $q->select('student_id')->from('parent_students')->where('parent_account_id', $account->id);
            })
            ->first();

        return $student ? trim("{$student->first_name} {$student->last_name}") : null;
    }
}
