import { apiRequest } from '@/lib/api';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';

export function fetchChatConversations() {
  return apiRequest<{ data: { items: ChatConversation[]; unread_total: number } }>(
    '/mobile/chat/conversations',
  ).then((r) => r.data);
}

export function fetchChatMessages(conversationId: string) {
  return apiRequest<{ data: ChatMessage[] }>(`/mobile/chat/conversations/${conversationId}/messages`).then(
    (r) => r.data,
  );
}

export function sendChatMessage(conversationId: string, body: string) {
  return apiRequest<{ data: ChatMessage }>(`/mobile/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { body },
  }).then((r) => r.data);
}

export function markChatConversationRead(conversationId: string) {
  return apiRequest<{ data: { conversation_id: string; read: boolean } }>(
    `/mobile/chat/conversations/${conversationId}/read`,
    { method: 'POST' },
  ).then((r) => r.data);
}
