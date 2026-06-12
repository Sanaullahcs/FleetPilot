"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PageHeader, Button, EmptyState } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { ComplaintFormModal } from "@/components/dashboard/complaint-form-modal";
import {
  COMPLAINT_ROLE_TABS,
  ComplaintQueueTabs,
  countComplaintsByRole,
  type ComplaintRoleTab,
} from "@/components/dashboard/complaint-queue-tabs";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { ContactCell } from "@/components/ui/contact-cell";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  addComplaintComment,
  getComplaint,
  getComplaintStats,
  listComplaintAssignees,
  listComplaints,
  listMyComplaints,
  updateComplaint,
} from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import type { ComplaintRecord, ComplaintUpdate } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_on_submitter", label: "Waiting on submitter" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Not accepted" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

function formatTime(iso: string) {
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "bg-red-100 text-red-800";
  if (priority === "high") return "bg-orange-100 text-orange-800";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-sky-50 text-sky-700";
}

function statusBadgeClass(status: string) {
  if (status === "submitted") return "bg-amber-50 text-amber-800";
  if (status === "in_progress" || status === "acknowledged") return "bg-blue-50 text-blue-800";
  if (status === "waiting_on_submitter") return "bg-violet-50 text-violet-800";
  if (status === "resolved") return "bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function roleLabel(role: string) {
  if (role === "school_contact") return "School";
  return titleCase(role.replace(/_/g, " "));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function isStaffAuthor(update: ComplaintUpdate) {
  return update.author.role === "admin" || update.author.role === "dispatcher" || update.type === "internal_note";
}

export default function ComplaintsPage() {
  const queryClient = useQueryClient();
  const can = usePermission();
  const isStaff = can("complaints.view");
  const canManage = can("complaints.update");

  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [priority, setPriority] = useState(searchParams.get("priority") ?? "");
  const [roleTab, setRoleTab] = useState<ComplaintRoleTab>("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [staffNote, setStaffNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const activityEndRef = useRef<HTMLDivElement>(null);

  const statsQuery = useQuery({
    queryKey: ["complaint-stats"],
    queryFn: getComplaintStats,
    enabled: isStaff,
    refetchInterval: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["complaints", { search, status, priority, roleTab, page, isStaff }],
    queryFn: () =>
      isStaff
        ? listComplaints({
            search,
            status: status || undefined,
            priority: priority || undefined,
            submitter_role: roleTab || undefined,
            page,
            per_page: 30,
            sort_by: "last_activity_at",
            sort_dir: "desc",
          })
        : listMyComplaints(status || undefined).then((r) => ({
            data: r.items,
            current_page: 1,
            last_page: 1,
            total: r.total,
          })),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

  const complaints = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data]);

  const filteredComplaints = useMemo(() => {
    let items = complaints;
    if (isStaff && roleTab) {
      items = items.filter((c) => c.submitter_role === roleTab);
    }
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.reference_number.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category_label.toLowerCase().includes(q) ||
        (c.submitter?.name ?? "").toLowerCase().includes(q),
    );
  }, [complaints, isStaff, roleTab, search]);

  const roleCounts = useMemo(() => countComplaintsByRole(complaints), [complaints]);
  const activeTabConfig = COMPLAINT_ROLE_TABS.find((t) => t.id === roleTab)!;

  const activeId = selectedId ?? filteredComplaints[0]?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ["complaint", activeId],
    queryFn: () => getComplaint(activeId!),
    enabled: !!activeId,
    refetchInterval: 8_000,
    placeholderData: keepPreviousData,
  });

  const assigneesQuery = useQuery({
    queryKey: ["complaint-assignees"],
    queryFn: listComplaintAssignees,
    enabled: canManage,
  });

  const detail = detailQuery.data;

  useEffect(() => {
    if (selectedId && !filteredComplaints.some((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredComplaints, selectedId]);

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.updates?.length, activeId]);

  useEffect(() => {
    setResolutionDraft(detail?.resolution_summary ?? "");
  }, [detail?.id, detail?.resolution_summary]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateComplaint(activeId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      void queryClient.invalidateQueries({ queryKey: ["complaint", activeId] });
      void queryClient.invalidateQueries({ queryKey: ["complaint-stats"] });
      setStaffNote("");
      setInternalNote("");
      toastSuccess("Complaint updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update complaint.")),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => addComplaintComment(activeId!, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      void queryClient.invalidateQueries({ queryKey: ["complaint", activeId] });
      setReplyDraft("");
      toastSuccess("Reply sent");
    },
    onError: (e) => toastError("Reply failed", getApiErrorMessage(e, "Could not send reply.")),
  });

  const onStaffUpdate = (patch: Record<string, unknown>) => {
    if (!activeId || !canManage) return;
    updateMutation.mutate(patch);
  };

  const canReply = detail && !isStaff && !["closed", "rejected", "resolved"].includes(detail.status);
  const isSyncing = listQuery.isFetching || (activeId ? detailQuery.isFetching : false);
  const listInitialLoading = listQuery.isLoading && !listQuery.data;

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[420px] flex-col gap-3">
      <PageHeader
        title={isStaff ? "Complaint center" : "My complaints"}
        description={
          isStaff && statsQuery.data
            ? `${statsQuery.data.open} open · ${statsQuery.data.urgent} urgent · ${statsQuery.data.unassigned} unassigned`
            : isStaff
              ? "Review, assign, and resolve registered complaints."
              : "Register and track formal complaints with transportation admin."
        }
        action={
          <div className="flex items-center gap-2">
            <LiveIndicator active={isSyncing || listQuery.isSuccess} />
            <Button size="sm" onClick={() => setFormOpen(true)}>
              + Register
            </Button>
          </div>
        }
      />

      {isStaff ? (
        <ComplaintQueueTabs
          active={roleTab}
          onChange={(tab) => {
            setRoleTab(tab);
            setSelectedId(null);
            setPage(1);
          }}
          counts={roleCounts}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          status={status}
          onStatusChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          priority={priority}
          onPriorityChange={(v) => {
            setPriority(v);
            setPage(1);
          }}
          statusOptions={STATUS_OPTIONS}
          priorityOptions={PRIORITY_OPTIONS}
          showStaffFilters
        />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-60">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my complaints…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
            />
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(260px,300px)_1fr]">
        <div className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {isStaff ? activeTabConfig.shortLabel : "My complaints"}
            </p>
            <p className="text-[10px] text-slate-400">{filteredComplaints.length} in queue</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listInitialLoading ? (
              <p className="px-3 py-6 text-xs text-slate-500">Loading…</p>
            ) : filteredComplaints.length ? (
              filteredComplaints.map((item) => {
                const active = item.id === activeId;
                const name = item.submitter?.name ?? roleLabel(item.submitter_role);
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
                      {initials(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-slate-900">{item.subject}</span>
                        <span className="shrink-0 text-[10px] text-slate-400">{formatListTime(item.last_activity_at)}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[9px] text-slate-400">{item.reference_number}</span>
                        <span className={cn("rounded px-1 py-0.5 text-[9px] font-semibold uppercase", statusBadgeClass(item.status))}>
                          {item.status_label}
                        </span>
                        <span className={cn("rounded px-1 py-0.5 text-[9px] font-semibold uppercase", priorityBadgeClass(item.priority))}>
                          {item.priority_label}
                        </span>
                      </span>
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {name} · {item.category_label}
                      </p>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-3">
                <EmptyState
                  message={
                    isStaff
                      ? "New registrations from mobile and school portal will appear here."
                      : "You have not registered any complaints yet."
                  }
                />
              </div>
            )}
          </div>
          {isStaff && (listQuery.data?.last_page ?? 1) > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500">
              <span>
                Page {listQuery.data?.current_page} / {listQuery.data?.last_page}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page >= (listQuery.data?.last_page ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_120px)]">
          {detail ? (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                      {initials(detail.submitter?.name ?? roleLabel(detail.submitter_role))}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{detail.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        {detail.reference_number} · {detail.submitter?.name ?? roleLabel(detail.submitter_role)} ·{" "}
                        {detail.category_label}
                      </p>
                    </div>
                  </div>
                  {detail.submitter ? (
                    <div className="text-right text-xs">
                      <ContactCell email={detail.submitter.email} phone={detail.submitter.phone ?? detail.contact_phone} />
                    </div>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <SearchableSelect
                      value={detail.status}
                      onChange={(v) => onStaffUpdate({ status: v })}
                      options={STATUS_OPTIONS}
                      showAllOption={false}
                      searchable={false}
                      disabled={updateMutation.isPending}
                    />
                    <SearchableSelect
                      value={detail.priority}
                      onChange={(v) => onStaffUpdate({ priority: v })}
                      options={PRIORITY_OPTIONS}
                      showAllOption={false}
                      searchable={false}
                      disabled={updateMutation.isPending}
                    />
                    <SearchableSelect
                      value={detail.assignee?.id ?? ""}
                      onChange={(v) => onStaffUpdate({ assigned_to_user_id: v || null })}
                      options={(assigneesQuery.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
                      placeholder="Assign to…"
                      allLabel="Unassigned"
                      searchable
                      disabled={updateMutation.isPending}
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", statusBadgeClass(detail.status))}>
                      {detail.status_label}
                    </span>
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", priorityBadgeClass(detail.priority))}>
                      {detail.priority_label}
                    </span>
                    {detail.assignee ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {detail.assignee.name}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-4">
                <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Original report</p>
                  <p className="whitespace-pre-wrap">{detail.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
                    {detail.incident_date ? <span>Incident: {detail.incident_date}</span> : null}
                    {detail.location_note ? <span>Location: {detail.location_note}</span> : null}
                    {detail.student ? <span>Student: {detail.student.name}</span> : null}
                    {detail.route ? <span>Route: {detail.route.name}</span> : null}
                  </div>
                </div>

                {(detail.updates ?? []).map((update) => {
                  if (update.is_internal && !canManage) return null;
                  const mine = update.author.role === "parent" || update.author.role === "driver" || update.author.role === "school_contact";
                  const system = update.type === "system";
                  if (system) {
                    return (
                      <div key={update.id} className="flex justify-center">
                        <p className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">{update.body}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={update.id} className={cn("flex", mine && !canManage ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[min(85%,420px)] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm",
                          update.is_internal
                            ? "rounded-bl-md border border-amber-200 bg-amber-50 text-amber-950"
                            : isStaffAuthor(update)
                              ? "rounded-bl-md border border-slate-100 bg-white text-slate-800"
                              : "rounded-br-md bg-brand-primary text-white",
                        )}
                      >
                        <p className="mb-0.5 text-[10px] font-semibold opacity-80">
                          {update.author.name}
                          {update.is_internal ? " · Internal" : ""}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{update.body}</p>
                        <p className={cn("mt-1 text-[10px]", update.is_internal || isStaffAuthor(update) ? "text-slate-400" : "text-white/65")}>
                          {formatTime(update.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={activityEndRef} />
              </div>

              {canManage ? (
                <div className="space-y-2 border-t border-slate-100 bg-white p-3">
                  <textarea
                    value={resolutionDraft}
                    onChange={(e) => setResolutionDraft(e.target.value)}
                    rows={2}
                    placeholder="Resolution summary (visible to submitter when resolved)…"
                    className="fp-input w-full resize-none text-sm"
                  />
                  <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10">
                    <textarea
                      value={staffNote}
                      onChange={(e) => setStaffNote(e.target.value)}
                      rows={2}
                      placeholder="Public reply to submitter…"
                      className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={!staffNote.trim() || updateMutation.isPending}
                      onClick={() => onStaffUpdate({ public_note: staffNote.trim() })}
                    >
                      Reply
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Internal note (staff only)…"
                      className="fp-input min-w-[200px] flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!internalNote.trim() || updateMutation.isPending}
                      onClick={() => onStaffUpdate({ internal_note: internalNote.trim() })}
                    >
                      Internal note
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        onStaffUpdate({
                          status: "waiting_on_submitter",
                          public_note: staffNote.trim() || undefined,
                        })
                      }
                    >
                      Request info
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={updateMutation.isPending || !resolutionDraft.trim()}
                      onClick={() =>
                        onStaffUpdate({
                          status: "resolved",
                          resolution_summary: resolutionDraft.trim(),
                        })
                      }
                    >
                      Mark resolved
                    </Button>
                  </div>
                </div>
              ) : canReply ? (
                <div className="border-t border-slate-100 bg-white p-3">
                  <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10">
                    <textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={2}
                      placeholder="Add information for the transportation team…"
                      className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={!replyDraft.trim() || replyMutation.isPending}
                      onClick={() => replyMutation.mutate(replyDraft.trim())}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState message="Select a complaint from the queue to review and respond." />
            </div>
          )}
        </div>
      </div>

      <ComplaintFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(id) => {
          setFormOpen(false);
          setSelectedId(id);
          void queryClient.invalidateQueries({ queryKey: ["complaints"] });
          void queryClient.invalidateQueries({ queryKey: ["complaint-stats"] });
          toastSuccess("Complaint registered", "Your reference number will appear in the list.");
        }}
      />
    </div>
  );
}
