"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, EmptyState, SearchInput } from "@/components/ui/primitives";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { NewMessageModal } from "@/components/dashboard/new-message-modal";
import { MessagesStatRow } from "@/components/dashboard/resource-stat-rows";
import {
  countConversationsByTab,
  filterConversationsByTab,
  MESSAGE_CATEGORY_TABS,
  MessageCategoryTabs,
  type MessageCategoryTab,
} from "@/components/dashboard/message-category-tabs";
import { getApiErrorMessage } from "@/lib/api";
import { toastError } from "@/lib/alerts";
import {
  listDashboardChatConversations,
  listDashboardChatMessages,
  sendDashboardChatMessage,
} from "@/lib/resources";
import { useAuthStore } from "@/store/auth";
import type { DashboardChatConversation, DashboardChatMessage } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

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

function typeLabel(type: DashboardChatConversation["type"]) {
  if (type === "parent_driver") return "Parent ↔ Driver";
  if (type === "parent_school") return "Parent ↔ School";
  if (type === "driver_school") return "Driver ↔ School";
  if (type === "parent_support") return "Parent ↔ Transportation";
  if (type === "staff_direct") return "Direct message";
  return "Driver support";
}

function participantLine(conversation: DashboardChatConversation) {
  return conversation.participants.map((p) => `${p.name} (${titleCase(p.role.replace(/_/g, " "))})`).join(" · ");
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

  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = count;
  }, [messages.length, activeId]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId],
  );

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
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description={
          unreadTotal > 0
            ? `${unreadTotal} unread across all categories · ${activeTabConfig.description}`
            : activeTabConfig.description
        }
        action={
          <div className="flex items-center gap-3">
            <LiveIndicator active={isSyncing || conversationsQuery.isSuccess} />
            {canStartChat ? (
              <Button size="sm" onClick={() => setNewMessageOpen(true)}>
                + New message
              </Button>
            ) : null}
          </div>
        }
      />

      <MessagesStatRow
        conversations={conversations}
        unreadTotal={unreadTotal}
        isLoading={conversationsInitialLoading}
      />

      {visibleTabs.length > 1 && (
        <MessageCategoryTabs
          active={activeTab}
          onChange={handleTabChange}
          counts={tabCounts}
          visibleTabs={visibleTabs}
        />
      )}

      <div className="fp-card p-4">
        <label className="fp-label mb-1.5 block">Search conversations</label>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by participant or message…"
        />
        {search.trim() ? (
          <p className="mt-2 text-xs font-medium text-brand-accent">
            {filteredConversations.length} conversation{filteredConversations.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[320px_1fr]">
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {activeTabConfig.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredConversations.length} conversation{filteredConversations.length === 1 ? "" : "s"}
              {tabCounts[activeTab].unread > 0
                ? ` · ${tabCounts[activeTab].unread} unread`
                : ""}
            </p>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {conversationsInitialLoading ? (
              <p className="px-4 py-8 text-sm text-slate-500">Loading conversations…</p>
            ) : filteredConversations.length ? (
              filteredConversations.map((item) => {
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
                <EmptyState message={activeTabConfig.emptyMessage} />
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col">
          {activeConversation ? (
            <>
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-primary/70">
                  {typeLabel(activeConversation.type)}
                </p>
                <p className="mt-1 text-lg font-semibold text-brand-secondary">{activeConversation.title}</p>
                <p className="mt-1 text-sm text-slate-500">{participantLine(activeConversation)}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messagesInitialLoading ? (
                  <p className="text-sm text-slate-500">Loading messages…</p>
                ) : messages.length ? (
                  <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-opacity",
                        message.is_mine
                          ? "ml-auto bg-brand-primary text-white"
                          : "bg-slate-100 text-brand-secondary",
                        message.id.startsWith("temp-") && "opacity-80",
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
                  ))}
                  <div ref={messagesEndRef} />
                  </>
                ) : (
                  <EmptyState message="No messages in this thread yet." />
                )}
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="flex gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    rows={2}
                    placeholder="Reply as dispatch…"
                    className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-primary"
                  />
                  <Button onClick={onSend} disabled={!draft.trim() || sendMutation.isPending}>
                    {sendMutation.isPending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                message={
                  filteredConversations.length
                    ? "Select a conversation to view messages."
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
