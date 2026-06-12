"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button, Spinner } from "@/components/ui/primitives";
import { listDashboardChatContacts, startDashboardChatConversation } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError } from "@/lib/alerts";
import { titleCase } from "@/lib/utils";
import type { DashboardChatContact } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  driver: "Drivers",
  parent: "Parents",
  school_contact: "School contacts",
  admin: "Administrators",
  dispatcher: "Dispatchers",
};

export function NewMessageModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const contactsQuery = useQuery({
    queryKey: ["dashboard-chat-contacts"],
    queryFn: listDashboardChatContacts,
    enabled: open,
  });

  const startMutation = useMutation({
    mutationFn: (userId: string) => startDashboardChatConversation(userId),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard-chat-conversations"] });
      onStarted(conversation.id);
      onClose();
      setSearch("");
    },
    onError: (error) => toastError("Could not start chat", getApiErrorMessage(error)),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = contactsQuery.data ?? [];
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q),
    );
  }, [contactsQuery.data, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DashboardChatContact[]>();
    for (const contact of filtered) {
      const key = contact.role;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(contact);
    }
    return map;
  }, [filtered]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New message"
      description="Start a conversation with anyone in your organization."
      size="md"
    >
      <div className="space-y-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, role, or ID…"
          className="fp-input"
          autoFocus
        />

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-xl border border-slate-200">
          {contactsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No contacts match your search.</p>
          ) : (
            Array.from(grouped.entries()).map(([role, contacts]) => (
              <div key={role}>
                <p className="sticky top-0 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {ROLE_LABELS[role] ?? titleCase(role.replace(/_/g, " "))}
                </p>
                <ul>
                  {contacts.map((contact) => (
                    <li key={contact.user_id}>
                      <button
                        type="button"
                        disabled={startMutation.isPending}
                        onClick={() => startMutation.mutate(contact.user_id)}
                        className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                          {contact.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{contact.name}</span>
                          <span className="block truncate text-xs text-slate-500">{contact.subtitle}</span>
                        </span>
                        {contact.conversation_id ? (
                          <span className="shrink-0 text-[10px] font-semibold text-brand-primary">Open thread</span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-slate-400">New</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
