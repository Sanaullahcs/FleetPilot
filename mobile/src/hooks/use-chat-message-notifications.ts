import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChatConversations } from '@/lib/chat-api';
import type { ChatConversation } from '@/lib/chat-types';
import { playMessageReceivedAlert } from '@/lib/message-alert-sound';
import { useChatBannerStore } from '@/store/chat-banner';

function snapshotConversations(items: ChatConversation[]) {
  return new Map(
    items.map((item) => [
      item.id,
      {
        unread: item.unread_count,
        lastTime: item.last_message?.time ?? '',
        lastMine: item.last_message?.is_mine ?? false,
      },
    ]),
  );
}

export function useChatMessageNotifications(enabled: boolean) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const showBanner = useChatBannerStore((s) => s.showBanner);
  const previousUnread = useRef<Map<string, { unread: number; lastTime: string; lastMine: boolean }>>(new Map());
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

    if (!initialized.current) {
      previousUnread.current = snapshotConversations(items);
      initialized.current = true;
      return;
    }

    for (const item of items) {
      const prevSnap = previousUnread.current.get(item.id) ?? { unread: 0, lastTime: '', lastMine: false };
      const nextCount = item.unread_count;
      const lastTime = item.last_message?.time ?? '';
      const lastMine = item.last_message?.is_mine ?? false;

      const unreadIncreased = nextCount > prevSnap.unread && nextCount > 0;
      const newIncomingMessage =
        lastTime && lastTime !== prevSnap.lastTime && !lastMine && !unreadIncreased;

      if (!unreadIncreased && !newIncomingMessage) {
        continue;
      }

      const onThisThread = pathname === `/chat/${item.id}`;
      if (onThisThread) {
        continue;
      }

      const payload = {
        conversationId: item.id,
        title: item.title,
        body: item.last_message?.body ?? 'New message',
      };

      void playMessageReceivedAlert(payload);
      showBanner(payload);

      void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
      break;
    }

    previousUnread.current = snapshotConversations(items);
  }, [conversations.data, enabled, pathname, queryClient, showBanner]);
}
