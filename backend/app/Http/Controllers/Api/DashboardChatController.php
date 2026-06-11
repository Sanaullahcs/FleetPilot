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
        if (! in_array($user->role, ['admin', 'dispatcher'], true)) {
            abort(403);
        }

        $items = $this->chat->listForStaff($user);

        return response()->json(['data' => ['items' => $items->values()->all()]]);
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

        return response()->json(['data' => $messages]);
    }

    public function send(Request $request, MobileChatConversation $conversation): JsonResponse
    {
        $user = $request->user();
        $this->chat->authorizeConversation($user, $conversation);

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
            'data' => $this->chat->messagePayload($message->load('sender:id,first_name,last_name,role'), $user->id),
        ], 201);
    }
}
