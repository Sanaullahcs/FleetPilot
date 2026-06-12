"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, EmptyState } from "@/components/ui/primitives";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { NewMessageModal } from "@/components/dashboard/new-message-modal";
import {
  countConversationsByTab,
  filterConversationsByTab,
  MESSAGE_CATEGORY_TABS,
  MessageCategoryTabs,
  type MessageCategoryTab,
} from "@/components/dashboard/message-category-tabs";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastMessageReceived } from "@/lib/alerts";
import { playMessageReceivedSound } from "@/lib/message-alert-sound";
import {
  listDashboardChatConversations,
  listDashboardChatMessages,
  sendDashboardChatMessage,
} from "@/lib/resources";
import { useAuthStore } from "@/store/auth";
import type { DashboardChatConversation, DashboardChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function typeLabel(type: DashboardChatConversation["type"]) {
  if (type === "parent_driver") return "Parent ↔ Driver";
  if (type === "parent_school") return "Parent ↔ School";
  if (type === "driver_school") return "Driver ↔ School";
  if (type === "parent_support") return "Transportation";
  if (type === "staff_direct") return "Direct";
  return "Driver support";
}

function typeBadgeClass(type: DashboardChatConversation["type"]) {
  if (type === "parent_driver") return "bg-cyan-50 text-cyan-700";
  if (type === "parent_school" || type === "driver_school") return "bg-violet-50 text-violet-700";
  if (type === "parent_support") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function initials(title: string) {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function visibleTabsForRole(role: string | undefined): MessageCategoryTab[] {
  if (role === "school_contact") {
    return ["parent_school", "driver_school"];
  }
  return ["all", "parent_driver", "parent_school", "driver_school", "parent_support", "driver_support"];
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const userRole = useAuthStore((s) => s.user?.role);
  const canStartChat = userRole === "admin" || userRole === "dispatcher";
  const visibleTabs = useMemo(() => visibleTabsForRole(userRole), [userRole]);
  const defaultTab = visibleTabs[0] ?? "all";

  const [activeTab, setActiveTab] = useState<MessageCategoryTab>(defaultTab);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevMessageIdsRef = useRef<Set<string>>(new Set());
  const threadAlertsReadyRef = useRef(false);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(defaultTab);
      setSelectedId(null);
    }
  }, [activeTab, defaultTab, visibleTabs]);

  const conversationsQuery = useQuery({
    queryKey: ["dashboard-chat-conversations"],
    queryFn: listDashboardChatConversations,
    refetchInterval: 2500,
    placeholderData: keepPreviousData,
  });

  const conversations = conversationsQuery.data?.items ?? [];
  const unreadTotal = conversationsQuery.data?.unread_total ?? 0;
  const tabCounts = useMemo(() => countConversationsByTab(conversations), [conversations]);

  const filteredConversations = useMemo(() => {
    let items = filterConversationsByTab(conversations, activeTab);
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const participantText = c.participants.map((p) => p.name).join(" ").toLowerCase();
      const lastBody = (c.last_message?.body ?? "").toLowerCase();
      return (
        participantText.includes(q) ||
        lastBody.includes(q) ||
        c.title.toLowerCase().includes(q) ||
        typeLabel(c.type).toLowerCase().includes(q)
      );
    });
  }, [conversations, activeTab, search]);

  const activeTabConfig = MESSAGE_CATEGORY_TABS.find((t) => t.id === activeTab)!;

  useEffect(() => {
    if (selectedId && !filteredConversations.some((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredConversations, selectedId]);

  const activeId = selectedId ?? filteredConversations[0]?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: ["dashboard-chat-messages", activeId],
    queryFn: () => listDashboardChatMessages(activeId!),
    enabled: !!activeId,
    refetchInterval: 2500,
    placeholderData: keepPreviousData,
  });

  const messages = messagesQuery.data ?? [];
  const messagesInitialLoading = messagesQuery.isLoading && !messagesQuery.data;

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = count;
  }, [messages.length, activeId]);

  useEffect(() => {
    threadAlertsReadyRef.current = false;
    prevMessageIdsRef.current = new Set();
  }, [activeId]);

  useEffect(() => {
    if (!messages.length) return;

    const ids = new Set(messages.map((message) => message.id));
    if (!threadAlertsReadyRef.current) {
      prevMessageIdsRef.current = ids;
      threadAlertsReadyRef.current = true;
      return;
    }

    const incoming = messages.filter(
      (message) => !prevMessageIdsRef.current.has(message.id) && !message.is_mine && !message.is_system,
    );

    if (incoming.length > 0) {
      playMessageReceivedSound();
      toastMessageReceived(
        activeConversation?.title ?? "New message",
        incoming[incoming.length - 1]?.body ?? "New message",
      );
    }

    prevMessageIdsRef.current = ids;
  }, [messages, activeConversation?.title]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendDashboardChatMessage(activeId!, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["dashboard-chat-messages", activeId] });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof listDashboardChatMessages>>>([
        "dashboard-chat-messages",
        activeId,
      ]);
      const optimistic: DashboardChatMessage = {
        id: `temp-${Date.now()}`,
        body,
        time: new Date().toISOString(),
        is_mine: true,
        is_system: false,
        sender: { id: null, name: "You", role: "dispatcher" },
      };
      queryClient.setQueryData(
        ["dashboard-chat-messages", activeId],
        [...(previous ?? []), optimistic],
      );
      setDraft("");
      return { previous };
    },
    onError: (error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["dashboard-chat-messages", activeId], context.previous);
      }
      toastError("Message failed", getApiErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-messages", activeId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-conversations"] });
    },
  });

  const onSend = () => {
    const body = draft.trim();
    if (!body || !activeId || sendMutation.isPending) return;
    sendMutation.mutate(body);
  };

  const conversationsInitialLoading = conversationsQuery.isLoading && !conversationsQuery.data;
  const isSyncing = conversationsQuery.isFetching || (activeId ? messagesQuery.isFetching : false);

  const handleTabChange = (tab: MessageCategoryTab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[420px] flex-col gap-3">
      <PageHeader
        title="Messages"
        description={
          unreadTotal > 0
            ? `${unreadTotal} unread · ${conversations.length} threads`
            : `${conversations.length} active threads`
        }
        action={
          <div className="flex items-center gap-2">
            <LiveIndicator active={isSyncing || conversationsQuery.isSuccess} />
            {canStartChat ? (
              <Button size="sm" onClick={() => setNewMessageOpen(true)}>
                + New
              </Button>
            ) : null}
          </div>
        }
      />

      <MessageCategoryTabs
        active={activeTab}
        onChange={handleTabChange}
        counts={tabCounts}
        visibleTabs={visibleTabs.length > 1 ? visibleTabs : undefined}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search threads…"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(240px,280px)_1fr]">
        <div className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {activeTabConfig.shortLabel}
            </p>
            <p className="text-[10px] text-slate-400">
              {filteredConversations.length}
              {tabCounts[activeTab].unread > 0 ? ` · ${tabCounts[activeTab].unread} unread` : ""}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversationsInitialLoading ? (
              <p className="px-3 py-6 text-xs text-slate-500">Loading…</p>
            ) : filteredConversations.length ? (
              filteredConversations.map((item) => {
                const active = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "flex w-full gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-50/80",
                      active && "bg-brand-primary/[0.06] hover:bg-brand-primary/[0.06]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        active ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {initials(item.title)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-slate-900">{item.title}</span>
                        {item.last_message ? (
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {formatListTime(item.last_message.time)}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span className={cn("rounded px-1 py-0.5 text-[9px] font-semibold uppercase", typeBadgeClass(item.type))}>
                          {typeLabel(item.type)}
                        </span>
                        {item.unread_count > 0 ? (
                          <span className="rounded-full bg-brand-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {item.unread_count}
                          </span>
                        ) : null}
                      </span>
                      {item.last_message ? (
                        <p className="mt-1 truncate text-[11px] text-slate-500">
                          {item.last_message.sender_name}: {item.last_message.body}
                        </p>
                      ) : null}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-3">
                <EmptyState message={activeTabConfig.emptyMessage} />
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_120px)]">
          {activeConversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                  {initials(activeConversation.title)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{activeConversation.title}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {activeConversation.participants.map((p) => p.name).join(" · ")}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold", typeBadgeClass(activeConversation.type))}>
                  {typeLabel(activeConversation.type)}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-4">
                {messagesInitialLoading ? (
                  <p className="text-xs text-slate-500">Loading messages…</p>
                ) : messages.length ? (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex", message.is_mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[min(85%,420px)] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm",
                            message.is_mine
                              ? "rounded-br-md bg-brand-primary text-white"
                              : "rounded-bl-md border border-slate-100 bg-white text-slate-800",
                            message.id.startsWith("temp-") && "opacity-75",
                          )}
                        >
                          {!message.is_mine && !message.is_system ? (
                            <p className="mb-0.5 text-[10px] font-semibold text-brand-primary">
                              {message.sender.name}
                            </p>
                          ) : null}
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <p className={cn("mt-1 text-[10px]", message.is_mine ? "text-white/65" : "text-slate-400")}>
                            {formatTime(message.time)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <EmptyState message="No messages yet. Say hello." />
                )}
              </div>

              <div className="border-t border-slate-100 bg-white p-3">
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    rows={1}
                    placeholder="Write a reply…"
                    className="max-h-24 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <Button
                    size="sm"
                    className="shrink-0 px-3"
                    onClick={onSend}
                    disabled={!draft.trim() || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? "…" : "Send"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                message={
                  filteredConversations.length
                    ? "Select a conversation."
                    : activeTabConfig.emptyMessage
                }
              />
            </div>
          )}
        </div>
      </div>

      <NewMessageModal
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onStarted={(conversationId) => {
          setSelectedId(conversationId);
          setActiveTab("all");
        }}
      />
    </div>
  );
}
