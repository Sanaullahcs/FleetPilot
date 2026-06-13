export type ChatConversationType =
  | 'driver_support'
  | 'driver_school'
  | 'parent_driver'
  | 'parent_school'
  | 'parent_support'
  | 'contractor_driver';

export type ChatAvatarType = 'support' | 'driver' | 'school' | 'parent';

export interface ChatConversation {
  id: string;
  type: ChatConversationType;
  title: string;
  subtitle: string | null;
  avatar_type: ChatAvatarType;
  student_id?: string | null;
  school_id?: string | null;
  last_message: {
    body: string;
    time: string;
    is_mine: boolean;
  } | null;
  unread_count: number;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  body: string;
  is_system: boolean;
  is_mine: boolean;
  time: string;
  sender: {
    id: string | null;
    name: string;
    role: string;
  };
}

export type ParentChatGroup = 'driver' | 'school' | 'support';
export type DriverChatGroup = 'parent' | 'school' | 'support' | 'contractor';

export function groupParentConversation(item: ChatConversation): ParentChatGroup | null {
  if (item.type === 'parent_driver') return 'driver';
  if (item.type === 'parent_school') return 'school';
  if (item.type === 'parent_support' || item.type === 'driver_support') return 'support';
  return null;
}

export function groupDriverConversation(item: ChatConversation): DriverChatGroup | null {
  if (item.type === 'parent_driver') return 'parent';
  if (item.type === 'driver_school') return 'school';
  if (item.type === 'contractor_driver') return 'contractor';
  if (item.type === 'driver_support') return 'support';
  return null;
}
