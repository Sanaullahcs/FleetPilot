"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button, Badge } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { FormLabel } from "@/components/ui/form-controls";
import { ContactCell } from "@/components/ui/contact-cell";
import { PageState } from "@/components/ui/page-state";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  addComplaintComment,
  getComplaint,
  listComplaintAssignees,
  updateComplaint,
} from "@/lib/resources";
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

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function updateTypeLabel(type: string, internal: boolean) {
  if (internal) return "Internal note";
  if (type === "status_change") return "Status change";
  if (type === "assignment") return "Assignment";
  if (type === "system") return "System";
  return "Comment";
}

interface ComplaintDetailModalProps {
  open: boolean;
  complaintId: string | null;
  onClose: () => void;
  canManage: boolean;
}

export function ComplaintDetailModal({ open, complaintId, onClose, canManage }: ComplaintDetailModalProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [resolution, setResolution] = useState("");
  const [comment, setComment] = useState("");
  const [commentType, setCommentType] = useState<"public" | "internal">("public");

  const detailQuery = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: () => getComplaint(complaintId!),
    enabled: open && !!complaintId,
  });

  const assigneesQuery = useQuery({
    queryKey: ["complaint-assignees"],
    queryFn: listComplaintAssignees,
    enabled: open && canManage,
  });

  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) return;
    setStatus(detail.status);
    setPriority(detail.priority);
    setAssigneeId(detail.assignee?.id ?? "");
    setResolution(detail.resolution_summary ?? "");
  }, [detail]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["complaints"] });
    void queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
    void queryClient.invalidateQueries({ queryKey: ["complaint-stats"] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateComplaint(complaintId!, payload),
    onSuccess: () => {
      invalidate();
      toastSuccess("Complaint updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not save changes.")),
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => addComplaintComment(complaintId!, body),
    onSuccess: () => {
      invalidate();
      setComment("");
      toastSuccess("Comment added");
    },
    onError: (e) => toastError("Comment failed", getApiErrorMessage(e, "Could not add comment.")),
  });

  const saveFields = () => {
    if (!complaintId || !canManage) return;
    updateMutation.mutate({
      status,
      priority,
      assigned_to_user_id: assigneeId || null,
      resolution_summary: resolution.trim() || null,
    });
  };

  const addComment = () => {
    if (!comment.trim()) return;
    if (commentType === "internal") {
      updateMutation.mutate({ internal_note: comment.trim() });
      setComment("");
      return;
    }
    commentMutation.mutate(comment.trim());
  };

  const visibleUpdates = (detail?.updates ?? []).filter((u) => canManage || !u.is_internal);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={detail?.reference_number ?? "Complaint"}
      description={detail?.subject}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          {canManage ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ status: "waiting_on_submitter" })}
            >
              Request info
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="secondary"
                  disabled={updateMutation.isPending || !resolution.trim()}
                  onClick={() =>
                    updateMutation.mutate({ status: "resolved", resolution_summary: resolution.trim() })
                  }
                >
                  Mark resolved
                </Button>
                <Button disabled={updateMutation.isPending} onClick={saveFields}>
                  Save changes
                </Button>
              </>
            ) : null}
          </div>
        </div>
      }
    >
      <PageState
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onRetry={() => void detailQuery.refetch()}
        isEmpty={!detailQuery.isLoading && !detail}
        emptyMessage="Complaint not found."
      >
        {detail ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Meta label="Submitter" value={detail.submitter?.name ?? "—"} />
              <Meta label="Role" value={titleCase(detail.submitter_role.replace(/_/g, " "))} />
              <Meta label="Category" value={detail.category_label} />
              <Meta label="Preferred contact" value={titleCase(detail.preferred_contact)} />
              {detail.incident_date ? <Meta label="Incident date" value={detail.incident_date} /> : null}
              {detail.student ? <Meta label="Student" value={detail.student.name} /> : null}
              {detail.route ? <Meta label="Route" value={detail.route.name} /> : null}
              {detail.school ? <Meta label="School" value={detail.school.name} /> : null}
            </div>

            {detail.submitter ? (
              <ContactCell email={detail.submitter.email} phone={detail.submitter.phone ?? detail.contact_phone} />
            ) : null}

            <div>
              <FormLabel>Description</FormLabel>
              <p className="mt-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {detail.description}
              </p>
            </div>

            {canManage ? (
              <div className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                <div>
                  <FormLabel>Status</FormLabel>
                  <SearchableSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} showAllOption={false} searchable={false} />
                </div>
                <div>
                  <FormLabel>Priority</FormLabel>
                  <SearchableSelect value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} showAllOption={false} searchable={false} />
                </div>
                <div>
                  <FormLabel>Assignee</FormLabel>
                  <SearchableSelect
                    value={assigneeId}
                    onChange={setAssigneeId}
                    options={(assigneesQuery.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
                    placeholder="Unassigned"
                    allLabel="Unassigned"
                    searchable
                  />
                </div>
                <div className="sm:col-span-3">
                  <FormLabel>Resolution summary</FormLabel>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={2}
                    className="fp-input mt-1.5 w-full resize-y text-sm"
                    placeholder="Summary visible to the submitter when resolved…"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Badge>{detail.status_label}</Badge>
                <Badge>{detail.priority_label}</Badge>
                {detail.assignee ? <Badge>{detail.assignee.name}</Badge> : null}
              </div>
            )}

            <div>
              <FormLabel>Activity log</FormLabel>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">When</th>
                      <th className="px-3 py-2.5">Author</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visibleUpdates.length ? (
                      visibleUpdates.map((row) => (
                        <ActivityRow key={row.id} row={row} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                          No activity yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {(canManage || !["closed", "rejected", "resolved"].includes(detail.status)) && (
              <div className="rounded-xl border border-slate-200 p-4">
                <FormLabel>Add comment</FormLabel>
                {canManage ? (
                  <div className="mb-2 mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCommentType("public")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                        commentType === "public" ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      Public reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentType("internal")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                        commentType === "internal" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      Internal note
                    </button>
                  </div>
                ) : null}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="fp-input w-full resize-y text-sm"
                  placeholder={canManage ? "Write an update for this complaint…" : "Add information for the transportation team…"}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!comment.trim() || updateMutation.isPending || commentMutation.isPending}
                    onClick={addComment}
                  >
                    Add comment
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </PageState>
    </Modal>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ActivityRow({ row }: { row: ComplaintUpdate }) {
  return (
    <tr className={row.is_internal ? "bg-amber-50/40" : undefined}>
      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">{formatWhen(row.created_at)}</td>
      <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{row.author.name}</td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
            row.is_internal ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600",
          )}
        >
          {updateTypeLabel(row.type, row.is_internal)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm text-slate-600">{row.body}</td>
    </tr>
  );
}
