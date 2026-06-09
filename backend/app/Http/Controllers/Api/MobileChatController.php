<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\MobileChatConversation;
use App\Models\MobileChatMessage;
use App\Models\ParentAccount;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MobileChatController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->ensureConversations($user);

        $items = MobileChatConversation::query()
            ->where('organization_id', $user->organization_id)
            ->whereJsonContains('participant_user_ids', $user->id)
            ->orderByDesc('last_message_at')
            ->get()
            ->map(fn (MobileChatConversation $c) => $this->conversationPayload($c, $user));

        $unread = $items->sum('unread_count');

        return response()->json([
            'data' => [
                'items' => $items->values()->all(),
                'unread_total' => $unread,
            ],
        ]);
    }

    public function messages(Request $request, MobileChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeConversation($user, $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,first_name,last_name,role')
            ->orderBy('created_at')
            ->limit(100)
            ->get()
            ->map(fn (MobileChatMessage $m) => $this->messagePayload($m));

        return response()->json(['data' => $messages]);
    }

    public function send(Request $request, MobileChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->authorizeConversation($user, $conversation);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = MobileChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $user->id,
            'body' => trim($data['body']),
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'data' => $this->messagePayload($message->load('sender:id,first_name,last_name,role')),
        ], 201);
    }

    private function authorizeConversation(User $user, MobileChatConversation $conversation): void
    {
        if ($conversation->organization_id !== $user->organization_id) {
            abort(403);
        }

        if (! in_array($user->id, $conversation->participant_user_ids ?? [], true)) {
            abort(403, 'You are not a participant in this conversation.');
        }
    }

    private function ensureConversations(User $user): void
    {
        if ($user->role === 'driver') {
            $this->ensureDriverSupport($user);
        }

        if ($user->role === 'parent') {
            $this->ensureParentThreads($user);
        }
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

        $dispatch = User::query()
            ->where('organization_id', $user->organization_id)
            ->whereIn('role', ['admin', 'dispatcher'])
            ->where('is_active', true)
            ->orderByRaw("CASE WHEN role = 'dispatcher' THEN 0 ELSE 1 END")
            ->first();

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

        if ($driver?->user_id) {
            $exists = MobileChatConversation::query()
                ->where('organization_id', $user->organization_id)
                ->where('type', 'parent_driver')
                ->whereJsonContains('participant_user_ids', $user->id)
                ->where('metadata->driver_id', $driver->id)
                ->exists();

            if (! $exists) {
                $conversation = MobileChatConversation::create([
                    'organization_id' => $user->organization_id,
                    'type' => 'parent_driver',
                    'title' => trim("{$driver->first_name} {$driver->last_name}"),
                    'participant_user_ids' => array_values(array_filter([$user->id, $driver->user_id])),
                    'metadata' => [
                        'subtitle' => "Bus driver · {$driver->employee_id}",
                        'driver_id' => $driver->id,
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
            $dispatch = User::query()
                ->where('organization_id', $user->organization_id)
                ->whereIn('role', ['admin', 'dispatcher'])
                ->where('is_active', true)
                ->first();

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

    private function seedWelcome(MobileChatConversation $conversation, ?User $sender, string $body): void
    {
        MobileChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $sender?->id,
            'body' => $body,
            'is_system' => $sender === null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function conversationPayload(MobileChatConversation $conversation, User $user): array
    {
        $last = $conversation->messages()->latest()->first();
        $unread = $conversation->messages()
            ->where('sender_user_id', '!=', $user->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'title' => $conversation->title,
            'subtitle' => $conversation->metadata['subtitle'] ?? null,
            'avatar_type' => $conversation->metadata['avatar_type'] ?? 'support',
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
    private function messagePayload(MobileChatMessage $message): array
    {
        $sender = $message->sender;

        return [
            'id' => $message->id,
            'body' => $message->body,
            'is_system' => $message->is_system,
            'is_mine' => auth()->id() === $message->sender_user_id,
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
}
