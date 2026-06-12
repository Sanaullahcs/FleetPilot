"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toastMessageReceived } from "@/lib/alerts";
import { playMessageReceivedSound } from "@/lib/message-alert-sound";
import { listDashboardChatConversations } from "@/lib/resources";
import { useAuthStore } from "@/store/auth";
import type { DashboardChatConversation } from "@/lib/types";

type ConversationSnapshot = {
  unread: number;
  lastTime: string;
  lastMine: boolean;
  title: string;
  preview: string;
};

function snapshotConversations(
  items: DashboardChatConversation[],
  viewerName: string | undefined,
): Map<string, ConversationSnapshot> {
  return new Map(
    items.map((item) => [
      item.id,
      {
        unread: item.unread_count,
        lastTime: item.last_message?.time ?? "",
        lastMine: !!viewerName && item.last_message?.sender_name === viewerName,
        title: item.title,
        preview: item.last_message?.body ?? "",
      },
    ]),
  );
}

export function useDashboardChatAlerts(enabled: boolean) {
  const pathname = usePathname();
  const viewerName = useAuthStore((s) => s.user?.full_name);
  const previous = useRef<Map<string, ConversationSnapshot>>(new Map());
  const initialized = useRef(false);

  const conversations = useQuery({
    queryKey: ["dashboard-chat-conversations"],
    queryFn: listDashboardChatConversations,
    enabled,
    refetchInterval: enabled ? 4_000 : false,
  });

  useEffect(() => {
    if (!enabled || !conversations.data?.items.length) {
      return;
    }

    const items = conversations.data.items;
    const current = snapshotConversations(items, viewerName);

    if (!initialized.current) {
      previous.current = current;
      initialized.current = true;
      return;
    }

    for (const item of items) {
      const prev = previous.current.get(item.id);
      const next = current.get(item.id);
      if (!next) continue;

      const unreadIncreased = prev ? next.unread > prev.unread : next.unread > 0;
      const newIncomingMessage =
        prev &&
        next.lastTime &&
        next.lastTime !== prev.lastTime &&
        !next.lastMine;

      if (!unreadIncreased && !newIncomingMessage) {
        continue;
      }

      if (pathname.startsWith("/dashboard/messages") && !unreadIncreased) {
        continue;
      }

      playMessageReceivedSound();
      toastMessageReceived(next.title, next.preview || "New message");
      break;
    }

    previous.current = current;
  }, [conversations.data, enabled, pathname, viewerName]);
}
