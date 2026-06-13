import type { QueryClient } from "@tanstack/react-query";
import type { MobileNotification } from "@/lib/types";

export type MobileNotificationsPayload = {
  items: MobileNotification[];
  total: number;
  unread: number;
};

const QUERY_ROOT = ["mobile-notifications"] as const;

export function patchMobileNotificationRead(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData<MobileNotificationsPayload>({ queryKey: QUERY_ROOT }, (previous) => {
    if (!previous) return previous;
    const wasUnread = previous.items.some((item) => item.id === id && !item.read);
    return {
      ...previous,
      items: previous.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      unread: wasUnread ? Math.max(0, previous.unread - 1) : previous.unread,
    };
  });
}

export function patchAllMobileNotificationsRead(queryClient: QueryClient) {
  queryClient.setQueriesData<MobileNotificationsPayload>({ queryKey: QUERY_ROOT }, (previous) => {
    if (!previous) return previous;
    return {
      ...previous,
      items: previous.items.map((item) => ({ ...item, read: true })),
      unread: 0,
    };
  });
}

export function invalidateMobileNotifications(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: QUERY_ROOT });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-conversations"] });
}
