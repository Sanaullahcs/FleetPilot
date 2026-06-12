"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { ComplaintStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { ComplaintFormModal } from "@/components/dashboard/complaint-form-modal";
import { ComplaintDetailModal } from "@/components/dashboard/complaint-detail-modal";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import { listComplaints, listMyComplaints, updateComplaint } from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { useTableSort } from "@/lib/table-utils";
import type { ComplaintRecord } from "@/lib/types";
import { titleCase } from "@/lib/utils";

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

const ROLE_OPTIONS = [
  { value: "parent", label: "Parents" },
  { value: "driver", label: "Drivers" },
  { value: "school_contact", label: "Schools" },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "bg-red-50 text-red-800 ring-1 ring-red-200";
  if (priority === "high") return "bg-orange-50 text-orange-800 ring-1 ring-orange-200";
  if (priority === "low") return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
  return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
}

function statusBadgeClass(status: string) {
  if (status === "submitted") return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  if (status === "in_progress" || status === "acknowledged") return "bg-blue-50 text-blue-800 ring-1 ring-blue-200";
  if (status === "waiting_on_submitter") return "bg-violet-50 text-violet-800 ring-1 ring-violet-200";
  if (status === "resolved") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (status === "rejected") return "bg-red-50 text-red-700 ring-1 ring-red-200";
  return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
}

function roleLabel(role: string) {
  if (role === "school_contact") return "School";
  return titleCase(role.replace(/_/g, " "));
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
  const [submitterRole, setSubmitterRole] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("last_activity_at", "desc");

  const listQuery = useQuery({
    queryKey: ["complaints", { search, status, priority, submitterRole, page, sortKey, sortDir, isStaff }],
    queryFn: () =>
      isStaff
        ? listComplaints({
            search,
            status: status || undefined,
            priority: priority || undefined,
            submitter_role: submitterRole || undefined,
            page,
            per_page: 20,
            ...sortParams,
          })
        : listMyComplaints(status || undefined).then((r) => ({
            data: r.items,
            current_page: 1,
            last_page: 1,
            total: r.total,
          })),
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateComplaint(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      void queryClient.invalidateQueries({ queryKey: ["complaint-stats"] });
      toastSuccess("Complaint updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update complaint.")),
  });

  const rows = listQuery.data?.data ?? [];

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSubmitterRole("");
    setPage(1);
  };

  const activePills = [
    ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
    ...(status ? [{ key: "status", label: `Status: ${STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}` }] : []),
    ...(priority ? [{ key: "priority", label: `Priority: ${PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority}` }] : []),
    ...(submitterRole ? [{ key: "role", label: `From: ${ROLE_OPTIONS.find((o) => o.value === submitterRole)?.label ?? submitterRole}` }] : []),
  ];

  const staffColumns: Column<ComplaintRecord>[] = [
    {
      key: "reference_number",
      header: "Reference",
      sortable: true,
      sortValue: (c) => c.reference_number,
      render: (c) => (
        <span className="font-mono text-xs font-medium text-slate-600">{c.reference_number}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      primary: true,
      sortable: true,
      sortValue: (c) => c.subject,
      render: (c) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-slate-900">{c.subject}</p>
          <p className="truncate text-xs text-slate-400">{c.category_label}</p>
        </div>
      ),
    },
    {
      key: "submitter",
      header: "Submitter",
      sortable: true,
      sortValue: (c) => c.submitter?.name ?? "",
      hideOnMobile: true,
      render: (c) => (
        <div>
          <p className="font-medium text-slate-800">{c.submitter?.name ?? "—"}</p>
          <p className="text-xs text-slate-400">{roleLabel(c.submitter_role)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (c) => c.status,
      render: (c) =>
        canManage ? (
          <SearchableSelect
            value={c.status}
            onChange={(v) => updateMutation.mutate({ id: c.id, payload: { status: v } })}
            options={STATUS_OPTIONS}
            showAllOption={false}
            searchable={false}
            compact
            disabled={updateMutation.isPending}
            className="min-w-[9.5rem]"
          />
        ) : (
          <Badge className={statusBadgeClass(c.status)}>{c.status_label}</Badge>
        ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      sortValue: (c) => c.priority,
      hideOnMobile: true,
      render: (c) =>
        canManage ? (
          <SearchableSelect
            value={c.priority}
            onChange={(v) => updateMutation.mutate({ id: c.id, payload: { priority: v } })}
            options={PRIORITY_OPTIONS}
            showAllOption={false}
            searchable={false}
            compact
            disabled={updateMutation.isPending}
            className="min-w-[7.5rem]"
          />
        ) : (
          <Badge className={priorityBadgeClass(c.priority)}>{c.priority_label}</Badge>
        ),
    },
    {
      key: "assignee",
      header: "Assignee",
      hideOnMobile: true,
      render: (c) =>
        c.assignee ? (
          <span className="text-sm text-slate-700">{c.assignee.name}</span>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      key: "last_activity_at",
      header: "Last activity",
      sortable: true,
      sortValue: (c) => c.last_activity_at,
      hideOnMobile: true,
      render: (c) => <span className="text-xs text-slate-500">{formatWhen(c.last_activity_at)}</span>,
    },
  ];

  const portalColumns: Column<ComplaintRecord>[] = [
    {
      key: "reference_number",
      header: "Reference",
      render: (c) => <span className="font-mono text-xs font-medium text-slate-600">{c.reference_number}</span>,
    },
    {
      key: "subject",
      header: "Subject",
      primary: true,
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">{c.subject}</p>
          <p className="text-xs text-slate-400">{c.category_label}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <Badge className={statusBadgeClass(c.status)}>{c.status_label}</Badge>,
    },
    {
      key: "priority",
      header: "Priority",
      hideOnMobile: true,
      render: (c) => <Badge className={priorityBadgeClass(c.priority)}>{c.priority_label}</Badge>,
    },
    {
      key: "last_activity_at",
      header: "Updated",
      hideOnMobile: true,
      render: (c) => <span className="text-xs text-slate-500">{formatWhen(c.last_activity_at)}</span>,
    },
  ];

  const columns = isStaff ? staffColumns : portalColumns;

  return (
    <div className="space-y-5">
      <PageHeader
        title={isStaff ? "Complaint center" : "My complaints"}
        description={
          isStaff
            ? "Review, assign, and resolve registered complaints from parents, drivers, and schools."
            : "Register and track formal complaints with transportation admin."
        }
        action={
          <div className="flex items-center gap-2">
            <LiveIndicator active={listQuery.isFetching || listQuery.isSuccess} />
            <Button onClick={() => setFormOpen(true)}>+ Register complaint</Button>
          </div>
        }
      />

      {isStaff ? <ComplaintStatRow /> : null}

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder={isStaff ? "Search reference, subject, submitter…" : "Search my complaints…"}
        resultCount={listQuery.data?.total}
        onClear={clearFilters}
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
            options: STATUS_OPTIONS,
          },
          ...(isStaff
            ? [
                {
                  key: "priority",
                  label: "Priority",
                  value: priority,
                  onChange: (v: string) => {
                    setPriority(v);
                    setPage(1);
                  },
                  options: PRIORITY_OPTIONS,
                },
                {
                  key: "submitter_role",
                  label: "Submitted by",
                  value: submitterRole,
                  onChange: (v: string) => {
                    setSubmitterRole(v);
                    setPage(1);
                  },
                  options: ROLE_OPTIONS,
                },
              ]
            : []),
        ]}
      />

      <ActiveFilterPills items={activePills} onRemove={(key) => {
        if (key === "search") setSearch("");
        if (key === "status") setStatus("");
        if (key === "priority") setPriority("");
        if (key === "role") setSubmitterRole("");
        setPage(1);
      }} />

      <PageState
        isLoading={listQuery.isLoading && !listQuery.data}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        isEmpty={!listQuery.isLoading && rows.length === 0}
        emptyMessage={
          isStaff
            ? "No complaints match your filters. New registrations from mobile and the school portal will appear here."
            : "You have not registered any complaints yet."
        }
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          sortKey={isStaff ? sortKey : undefined}
          sortDir={isStaff ? sortDir : undefined}
          onSortChange={
            isStaff
              ? (key, dir) => {
                  onSortChange(key, dir);
                  setPage(1);
                }
              : undefined
          }
          actions={(c) => (
            <RowActions
              items={[
                {
                  label: canManage ? "Manage" : "View details",
                  onClick: () => setDetailId(c.id),
                },
                ...(canManage
                  ? [
                      {
                        label: "Mark resolved",
                        onClick: () => updateMutation.mutate({ id: c.id, payload: { status: "resolved" } }),
                        hidden: c.status === "resolved" || c.status === "closed",
                      },
                      {
                        label: "Request info",
                        onClick: () => updateMutation.mutate({ id: c.id, payload: { status: "waiting_on_submitter" } }),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        />

        {isStaff && (listQuery.data?.last_page ?? 1) > 1 ? (
          <Pagination
            page={page}
            lastPage={listQuery.data?.last_page ?? 1}
            total={listQuery.data?.total ?? 0}
            onPageChange={setPage}
          />
        ) : null}
      </PageState>

      <ComplaintDetailModal
        open={!!detailId}
        complaintId={detailId}
        onClose={() => setDetailId(null)}
        canManage={canManage}
      />

      <ComplaintFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(id) => {
          setFormOpen(false);
          setDetailId(id);
          void queryClient.invalidateQueries({ queryKey: ["complaints"] });
          void queryClient.invalidateQueries({ queryKey: ["complaint-stats"] });
          toastSuccess("Complaint registered", "Your reference number will appear in the list.");
        }}
      />
    </div>
  );
}
