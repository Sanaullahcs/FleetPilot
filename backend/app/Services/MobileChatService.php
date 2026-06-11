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
    public function ensureConversations(User $user): void
    {
        if ($user->role === 'driver') {
            $this->ensureDriverSupport($user);
            $this->ensureDriverParentThreads($user);
        }

        if ($user->role === 'parent') {
            $this->ensureParentThreads($user);
        }
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listForUser(User $user): Collection
    {
        $this->ensureConversations($user);

        return MobileChatConversation::query()
            ->where('organization_id', $user->organization_id)
            ->whereJsonContains('participant_user_ids', $user->id)
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
            ->map(fn (MobileChatConversation $c) => $this->staffConversationPayload($c))
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

        if (! in_array($user->id, $conversation->participant_user_ids ?? [], true)) {
            abort(403, 'You are not a participant in this conversation.');
        }
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

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'title' => $title,
            'subtitle' => $subtitle,
            'avatar_type' => $avatarType,
            'last_message' => $last ? [
                'body' => Str::limit($last->body, 80),
                'time' => $last->created_at->toIso8601String(),
                'is_mine' => $last->sender_user_id === $user->id,
            ] : null,
            'unread_count' => min($unread, 9),
            'updated_at' => ($conversation->last_message_at ?? $conversation->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function staffConversationPayload(MobileChatConversation $conversation): array
    {
        $last = $conversation->messages()->latest()->first();
        $metadata = $conversation->metadata ?? [];

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'title' => $this->staffConversationTitle($conversation),
            'subtitle' => $metadata['subtitle'] ?? null,
            'participants' => $this->participantSummaries($conversation),
            'last_message' => $last ? [
                'body' => Str::limit($last->body, 120),
                'time' => $last->created_at->toIso8601String(),
                'sender_name' => $last->sender ? trim("{$last->sender->first_name} {$last->sender->last_name}") : 'System',
            ] : null,
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
        if ($user->role !== 'driver' || $conversation->type !== 'parent_driver') {
            return true;
        }

        $other = $this->otherParticipantUser($conversation, $user);

        return $other !== null && $other->id !== $user->id && $other->role === 'parent';
    }

    private function ensureDriverSupport(User $user): void
    {
        $exists = MobileChatConversation::query()
            ->where('organization_id', $user->organization_id)
            ->where('type', 'driver_support')
            ->whereJsonContains('participant_user_ids', $user->id)
            ->exists();

        if ($exists) {
            return;
        }

        $dispatch = $this->findDispatchUser($user->organization_id);
        $participants = array_values(array_filter([$user->id, $dispatch?->id]));

        $conversation = MobileChatConversation::create([
            'organization_id' => $user->organization_id,
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
                    organizationId: $user->organization_id,
                    parentUser: $account->user,
                    driver: $driver,
                    student: $student,
                );
            }
        }
    }

    private function ensureParentThreads(User $user): void
    {
        $account = ParentAccount::where('user_id', $user->id)->first();
        $students = $account
            ? Student::query()->whereIn('id', function ($q) use ($account) {
                $q->select('student_id')->from('parent_students')->where('parent_account_id', $account->id);
            })->with(['assignedDriver.user', 'school'])->get()
            : collect();

        $driver = $students->first()?->assignedDriver;
        $school = $students->first()?->school;

        if ($driver?->user_id && $students->first()) {
            $this->ensureParentDriverConversation(
                organizationId: $user->organization_id,
                parentUser: $user,
                driver: $driver,
                student: $students->first(),
            );
        }

        if ($school) {
            $exists = MobileChatConversation::query()
                ->where('organization_id', $user->organization_id)
                ->where('type', 'parent_school')
                ->whereJsonContains('participant_user_ids', $user->id)
                ->where('metadata->school_id', $school->id)
                ->exists();

            if (! $exists) {
                $liaison = User::query()
                    ->where('organization_id', $user->organization_id)
                    ->where('school_id', $school->id)
                    ->where('is_active', true)
                    ->first();

                $participants = array_values(array_unique(array_filter([
                    $user->id,
                    $liaison?->id,
                ])));

                $conversation = MobileChatConversation::create([
                    'organization_id' => $user->organization_id,
                    'type' => 'parent_school',
                    'title' => $school->name,
                    'participant_user_ids' => $participants ?: [$user->id],
                    'metadata' => [
                        'subtitle' => 'Transportation office',
                        'school_id' => $school->id,
                        'avatar_type' => 'school',
                    ],
                    'last_message_at' => now()->subHours(2),
                ]);

                $this->seedWelcome($conversation, null, "Hello from {$school->name} transportation. We're here for enrollment and route changes.");
            }
        }

        $supportExists = MobileChatConversation::query()
            ->where('organization_id', $user->organization_id)
            ->where('type', 'driver_support')
            ->whereJsonContains('participant_user_ids', $user->id)
            ->exists();

        if (! $supportExists) {
            $dispatch = $this->findDispatchUser($user->organization_id);

            $conversation = MobileChatConversation::create([
                'organization_id' => $user->organization_id,
                'type' => 'driver_support',
                'title' => 'FleetPilot Support',
                'participant_user_ids' => array_values(array_filter([$user->id, $dispatch?->id])),
                'metadata' => [
                    'subtitle' => 'App help & general questions',
                    'avatar_type' => 'support',
                ],
                'last_message_at' => now()->subDay(),
            ]);

            $this->seedWelcome($conversation, $dispatch, 'How can we help you today?');
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
            ->whereJsonContains('participant_user_ids', $parentUser->id)
            ->whereJsonContains('participant_user_ids', $driver->user_id)
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

        return [
            $conversation->title,
            $metadata['subtitle'] ?? null,
            $metadata['avatar_type'] ?? 'support',
        ];
    }

    private function staffConversationTitle(MobileChatConversation $conversation): string
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
                return "{$driver['name']} · Support";
            }
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
