export type ChatConversationType = 'driver_support' | 'parent_driver' | 'parent_school';

export type ChatAvatarType = 'support' | 'driver' | 'school' | 'parent';

export interface ChatConversation {
  id: string;
  type: ChatConversationType;
  title: string;
  subtitle: string | null;
  avatar_type: ChatAvatarType;
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
