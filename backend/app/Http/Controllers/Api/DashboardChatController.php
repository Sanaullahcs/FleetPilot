<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MobileChatConversation;
use App\Models\MobileChatMessage;
use App\Services\MobileChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardChatController extends Controller
{
    public function __construct(private readonly MobileChatService $chat)
    {
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        if (in_array($user->role, ['admin', 'dispatcher'], true)) {
            $items = $this->chat->listForStaff($user);
        } elseif ($user->role === 'school_contact') {
            $items = $this->chat->listForSchoolContact($user);
        } elseif ($user->role === 'contractor') {
            $items = $this->chat->listForContractor($user);
        } elseif (in_array($user->role, ['parent', 'driver'], true)) {
            $items = $this->chat->listForUser($user);
        } else {
            abort(403);
        }

        return response()->json([
            'data' => [
                'items' => $items->values()->all(),
                'unread_total' => $items->sum('unread_count'),
            ],
        ]);
    }

    public function messages(Request $request, MobileChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->chat->authorizeConversation($user, $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,first_name,last_name,role')
            ->orderBy('created_at')
            ->limit(100)
            ->get()
            ->map(fn (MobileChatMessage $m) => $this->chat->messagePayload($m, $user->id));

        $this->chat->markConversationRead($user, $conversation);

        return response()->json(['data' => $messages]);
    }

    public function markRead(Request $request, MobileChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->chat->authorizeConversation($user, $conversation);
        $this->chat->markConversationRead($user, $conversation);

        return response()->json(['data' => ['conversation_id' => $conversation->id, 'read' => true]]);
    }

    public function send(Request $request, MobileChatConversation $conversation): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = $this->chat->sendMessage($user, $conversation, $data['body']);

        return response()->json([
            'data' => $this->chat->messagePayload($message, $user->id),
        ], 201);
    }

    public function contacts(Request $request): JsonResponse
    {
        $user = $request->user();

        if (in_array($user->role, ['admin', 'dispatcher'], true)) {
            return response()->json([
                'data' => $this->chat->listMessageableContacts($user),
            ]);
        }

        if ($user->role === 'school_contact') {
            return response()->json([
                'data' => $this->chat->listMessageableContactsForSchoolContact($user),
            ]);
        }

        if ($user->role === 'contractor') {
            return response()->json([
                'data' => $this->chat->listMessageableContactsForContractor($user),
            ]);
        }

        abort(403);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
        ]);

        if (in_array($user->role, ['admin', 'dispatcher'], true)) {
            $conversation = $this->chat->findOrCreateStaffConversation($user, $data['user_id']);
        } elseif ($user->role === 'school_contact') {
            $conversation = $this->chat->findOrCreateSchoolContactConversation($user, $data['user_id']);
        } elseif ($user->role === 'contractor') {
            $conversation = $this->chat->findOrCreateContractorConversation($user, $data['user_id']);
        } else {
            abort(403);
        }

        return response()->json([
            'data' => $this->chat->staffConversationPayload($conversation, $user),
        ], 201);
    }
}
