import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChatConversations } from '@/lib/chat-api';
import type { ChatConversation } from '@/lib/chat-types';
import { useChatBannerStore } from '@/store/chat-banner';

function snapshotConversations(items: ChatConversation[]) {
  return new Map(items.map((item) => [item.id, item.unread_count]));
}

export function useChatMessageNotifications(enabled: boolean) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const showBanner = useChatBannerStore((s) => s.showBanner);
  const previousUnread = useRef<Map<string, number>>(new Map());
  const initialized = useRef(false);

  const conversations = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchChatConversations,
    enabled,
    refetchInterval: enabled ? 4_000 : false,
  });

  useEffect(() => {
    if (!enabled || !conversations.data?.items.length) {
      return;
    }

    const items = conversations.data.items;
    const current = snapshotConversations(items);

    if (!initialized.current) {
      previousUnread.current = current;
      initialized.current = true;
      return;
    }

    for (const item of items) {
      const prevCount = previousUnread.current.get(item.id) ?? 0;
      const nextCount = item.unread_count;

      if (nextCount <= prevCount || nextCount <= 0) {
        continue;
      }

      const onThisThread = pathname === `/chat/${item.id}`;
      if (onThisThread) {
        continue;
      }

      showBanner({
        conversationId: item.id,
        title: item.title,
        body: item.last_message?.body ?? 'New message',
      });

      void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
      break;
    }

    previousUnread.current = current;
  }, [conversations.data, enabled, pathname, queryClient, showBanner]);
}
