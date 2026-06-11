"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, EmptyState } from "@/components/ui/primitives";
import { getApiErrorMessage } from "@/lib/api";
import { toastError } from "@/lib/alerts";
import {
  listDashboardChatConversations,
  listDashboardChatMessages,
  sendDashboardChatMessage,
} from "@/lib/resources";
import type { DashboardChatConversation } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeLabel(type: DashboardChatConversation["type"]) {
  if (type === "parent_driver") return "Parent ↔ Driver";
  if (type === "parent_school") return "Parent ↔ School";
  return "Driver support";
}

function participantLine(conversation: DashboardChatConversation) {
  return conversation.participants.map((p) => `${p.name} (${titleCase(p.role.replace(/_/g, " "))})`).join(" · ");
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["dashboard-chat-conversations"],
    queryFn: listDashboardChatConversations,
    refetchInterval: 5_000,
  });

  const conversations = conversationsQuery.data?.items ?? [];
  const unreadTotal = conversationsQuery.data?.unread_total ?? 0;
  const activeId = selectedId ?? conversations[0]?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: ["dashboard-chat-messages", activeId],
    queryFn: () => listDashboardChatMessages(activeId!),
    enabled: !!activeId,
    refetchInterval: 4_000,
  });

  useEffect(() => {
    if (messagesQuery.isSuccess && activeId) {
      void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-conversations"] });
    }
  }, [messagesQuery.isSuccess, activeId, queryClient]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId],
  );

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendDashboardChatMessage(activeId!, body),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-messages", activeId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-conversations"] });
    },
    onError: (error) => toastError("Message failed", getApiErrorMessage(error)),
  });

  const onSend = () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    sendMutation.mutate(body);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle={
          unreadTotal > 0
            ? `${unreadTotal} unread conversation${unreadTotal === 1 ? "" : "s"} across parent, driver, and dispatch threads.`
            : "Monitor parent, driver, and dispatch conversations with the correct participants."
        }
      />

      <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[320px_1fr]">
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Conversations</p>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <p className="px-4 py-8 text-sm text-slate-500">Loading conversations…</p>
            ) : conversations.length ? (
              conversations.map((item) => {
                const active = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50",
                      active && "bg-brand-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-secondary">{item.title}</p>
                        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-primary/70">
                          {typeLabel(item.type)}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">{participantLine(item)}</p>
                        {item.last_message ? (
                          <p className="mt-2 truncate text-xs text-slate-400">
                            {item.last_message.sender_name}: {item.last_message.body}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {item.last_message ? (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {formatTime(item.last_message.time)}
                          </span>
                        ) : null}
                        {item.unread_count > 0 ? (
                          <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
                            {item.unread_count > 99 ? "99+" : item.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4">
                <EmptyState message="No conversations yet." />
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col">
          {activeConversation ? (
            <>
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-lg font-semibold text-brand-secondary">{activeConversation.title}</p>
                <p className="mt-1 text-sm text-slate-500">{participantLine(activeConversation)}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messagesQuery.isLoading ? (
                  <p className="text-sm text-slate-500">Loading messages…</p>
                ) : messagesQuery.data?.length ? (
                  messagesQuery.data.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                        message.is_mine
                          ? "ml-auto bg-brand-primary text-white"
                          : "bg-slate-100 text-brand-secondary",
                      )}
                    >
                      {!message.is_mine ? (
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-primary">
                          {message.sender.name}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p className={cn("mt-2 text-[10px]", message.is_mine ? "text-white/70" : "text-slate-400")}>
                        {formatTime(message.time)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState message="No messages in this thread yet." />
                )}
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="flex gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    placeholder="Reply as dispatch…"
                    className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-primary"
                  />
                  <Button onClick={onSend} disabled={!draft.trim() || sendMutation.isPending}>
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState message="Select a conversation to view messages." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
