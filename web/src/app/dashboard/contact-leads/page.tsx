"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge, Spinner } from "@/components/ui/primitives";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { Modal } from "@/components/ui/modal";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  archiveMarketingContact,
  getMarketingContact,
  getMarketingContactStats,
  listMarketingContacts,
  markMarketingContactRead,
} from "@/lib/resources";
import { useTableSort } from "@/lib/table-utils";
import type { MarketingContactLead } from "@/lib/types";
import { titleCase } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string) {
  if (status === "new") return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
  if (status === "read") return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
}

function inquiryLabel(type: string) {
  const map: Record<string, string> = {
    demo: "Demo request",
    pricing: "Pricing",
    support: "Support",
    partnership: "Partnership",
    other: "Other",
  };
  return map[type] ?? titleCase(type);
}

function roleLabel(type: string) {
  const map: Record<string, string> = {
    district: "District",
    contractor: "Contractor",
    school: "School",
    other: "Other",
  };
  return map[type] ?? titleCase(type);
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`fp-card px-4 py-3 ${accent ? "ring-2 ring-brand-primary/20" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function LeadDetailModal({
  leadId,
  open,
  onClose,
}: {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ["marketing-contact", leadId],
    queryFn: () => getMarketingContact(leadId!),
    enabled: open && !!leadId,
  });

  const readMutation = useMutation({
    mutationFn: markMarketingContactRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-contact-stats"] });
      if (leadId) queryClient.invalidateQueries({ queryKey: ["marketing-contact", leadId] });
      toastSuccess("Marked as read");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e)),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveMarketingContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-contact-stats"] });
      if (leadId) queryClient.invalidateQueries({ queryKey: ["marketing-contact", leadId] });
      toastSuccess("Lead archived");
      onClose();
    },
    onError: (e) => toastError("Archive failed", getApiErrorMessage(e)),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={lead?.full_name ?? "Contact lead"}
      description={lead ? `${inquiryLabel(lead.inquiry_type)} · ${formatWhen(lead.created_at)}` : undefined}
      footer={
        lead ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Close
            </button>
            {lead.status === "new" && (
              <Button onClick={() => readMutation.mutate(lead.id)} disabled={readMutation.isPending}>
                Mark as read
              </Button>
            )}
            {lead.status !== "archived" && (
              <Button
                variant={lead.status === "new" ? "secondary" : "primary"}
                onClick={() => archiveMutation.mutate(lead.id)}
                disabled={archiveMutation.isPending}
              >
                Archive
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      )}
      {isError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Unable to load this lead.</p>
      )}
      {lead && (
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Email" value={lead.email} />
          <Detail label="Phone" value={lead.phone ?? "—"} />
          <Detail label="Organization" value={lead.organization_name ?? "—"} />
          <Detail label="Role" value={roleLabel(lead.role_type)} />
          <Detail label="Fleet size" value={lead.fleet_size ?? "—"} />
          <Detail label="Inquiry" value={inquiryLabel(lead.inquiry_type)} />
          <Detail label="Subject" value={lead.subject ?? "—"} className="sm:col-span-2" />
          <Detail label="Status" value={<Badge className={statusBadgeClass(lead.status)}>{titleCase(lead.status)}</Badge>} />
          <Detail label="Submitted" value={formatWhen(lead.created_at)} />
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</dt>
            <dd className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {lead.message}
            </dd>
          </div>
        </dl>
      )}
    </Modal>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default function ContactLeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("created_at", "desc");

  const statsQuery = useQuery({
    queryKey: ["marketing-contact-stats"],
    queryFn: getMarketingContactStats,
  });

  const listQuery = useQuery({
    queryKey: ["marketing-contacts", { search, status, page, sortKey, sortDir }],
    queryFn: () =>
      listMarketingContacts({
        search,
        status: status || undefined,
        page,
        ...sortParams,
      }),
    placeholderData: keepPreviousData,
  });

  const readMutation = useMutation({
    mutationFn: markMarketingContactRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-contact-stats"] });
      toastSuccess("Marked as read");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e)),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveMarketingContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["marketing-contact-stats"] });
      toastSuccess("Lead archived");
    },
    onError: (e) => toastError("Archive failed", getApiErrorMessage(e)),
  });

  const columns: Column<MarketingContactLead>[] = [
    {
      key: "full_name",
      header: "Contact",
      primary: true,
      sortable: true,
      sortValue: (l) => l.full_name,
      render: (l) => (
        <div>
          <p className="font-medium text-slate-900">{l.full_name}</p>
          <p className="text-xs text-slate-400">{l.email}</p>
        </div>
      ),
    },
    {
      key: "organization_name",
      header: "Organization",
      sortable: true,
      hideOnMobile: true,
      sortValue: (l) => l.organization_name ?? "",
      render: (l) => l.organization_name ?? "—",
    },
    {
      key: "inquiry_type",
      header: "Inquiry",
      hideOnMobile: true,
      render: (l) => inquiryLabel(l.inquiry_type),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (l) => l.status,
      render: (l) => <Badge className={statusBadgeClass(l.status)}>{titleCase(l.status)}</Badge>,
    },
    {
      key: "created_at",
      header: "Received",
      sortable: true,
      sortValue: (l) => l.created_at,
      render: (l) => formatWhen(l.created_at),
    },
  ];

  const stats = statsQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contact leads"
        description="Website contact form submissions from the marketing homepage."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New" value={stats?.new ?? 0} accent={(stats?.new ?? 0) > 0} />
        <StatCard label="Read" value={stats?.read ?? 0} />
        <StatCard label="Archived" value={stats?.archived ?? 0} />
        <StatCard label="Total" value={stats?.total ?? 0} />
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search leads…"
        resultCount={listQuery.data?.total}
        onClear={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            options: STATUS_OPTIONS,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
          },
        ]}
      />

      <ActiveFilterPills
        pills={[
          status ? { key: "status", label: `Status: ${titleCase(status)}`, onRemove: () => setStatus("") } : null,
        ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[]}
      />

      <PageState
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        isEmpty={!listQuery.isLoading && !listQuery.isError && (listQuery.data?.data.length ?? 0) === 0}
        emptyMessage="No contact leads yet."
        onRetry={() => listQuery.refetch()}
      >
        <DataTable
          columns={columns}
          rows={listQuery.data?.data ?? []}
          rowKey={(l) => l.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => {
            onSortChange(key, dir);
            setPage(1);
          }}
          actions={(l) => (
            <RowActions
              items={[
                { label: "View details", onClick: () => setDetailId(l.id) },
                ...(l.status === "new"
                  ? [{ label: "Mark read", onClick: () => readMutation.mutate(l.id) }]
                  : l.status === "read"
                    ? [{ label: "Archive", onClick: () => archiveMutation.mutate(l.id), variant: "danger" as const }]
                    : []),
              ]}
            />
          )}
        />
      </PageState>

      {listQuery.data && listQuery.data.last_page > 1 && (
        <Pagination page={listQuery.data.current_page} lastPage={listQuery.data.last_page} total={listQuery.data.total} onPageChange={setPage} />
      )}

      <LeadDetailModal leadId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
