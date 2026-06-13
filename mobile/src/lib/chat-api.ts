import { apiRequest } from '@/lib/api';
import type { ChatConversation, ChatMessage, DriverChatGroup, ParentChatGroup } from '@/lib/chat-types';
import { groupDriverConversation, groupParentConversation } from '@/lib/chat-types';

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

export async function findDriverConversationForStudent(studentId: string) {
  const data = await fetchChatConversations();
  return (
    data.items.find((item) => item.type === 'parent_driver' && item.student_id === studentId) ??
    data.items.find((item) => item.type === 'parent_driver') ??
    null
  );
}

export async function findSchoolConversationForSchool(schoolId: string) {
  const data = await fetchChatConversations();
  return data.items.find((item) => item.type === 'parent_school' && item.school_id === schoolId) ?? null;
}

export async function findParentSupportConversation() {
  const data = await fetchChatConversations();
  return (
    data.items.find((item) => item.type === 'parent_support') ??
    data.items.find((item) => item.type === 'driver_support') ??
    null
  );
}

export async function findDriverSchoolConversationForSchool(schoolId: string) {
  const data = await fetchChatConversations();
  return data.items.find((item) => item.type === 'driver_school' && item.school_id === schoolId) ?? null;
}

export async function findDriverSupportConversation() {
  const data = await fetchChatConversations();
  return data.items.find((item) => item.type === 'driver_support') ?? null;
}

export function groupDriverConversations(items: ChatConversation[]) {
  const groups: Record<DriverChatGroup, ChatConversation[]> = {
    parent: [],
    school: [],
    support: [],
    contractor: [],
  };

  for (const item of items) {
    const group = groupDriverConversation(item);
    if (group) groups[group].push(item);
  }

  return groups;
}

export function groupParentConversations(items: ChatConversation[]) {
  const groups: Record<ParentChatGroup, ChatConversation[]> = {
    driver: [],
    school: [],
    support: [],
  };

  for (const item of items) {
    const group = groupParentConversation(item);
    if (group) groups[group].push(item);
  }

  return groups;
}
