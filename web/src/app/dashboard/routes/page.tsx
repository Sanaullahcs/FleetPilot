"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { RouteDetailModal } from "@/components/dashboard/route-detail-modal";
import { RouteFormModal } from "@/components/dashboard/route-form";
import { StatusChip } from "@/components/dashboard/status-chip";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { promptChangeStatus } from "@/lib/status-alerts";
import { ROUTE_STATUS_OPTIONS } from "@/lib/status-options";
import { getApiErrorMessage } from "@/lib/api";
import { deleteRoute, listRoutes, updateRouteStatus } from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { titleCase } from "@/lib/utils";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { RouteItem } from "@/lib/types";

const TYPE_OPTIONS = [
  { label: "Morning (AM)", value: "am" },
  { label: "Afternoon (PM)", value: "pm" },
  { label: "Midday", value: "midday" },
  { label: "Activity", value: "activity" },
  { label: "Special education", value: "sped" },
  { label: "Charter / field trip", value: "charter" },
];

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Sped",
  charter: "Charter",
};

export default function RoutesPage() {
  const can = usePermission();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("code");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingName, setViewingName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RouteItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["routes", { search, type, page, sortKey, sortDir }],
    queryFn: () => listRoutes({ search, type, page, ...sortParams }),
  });

  const removeMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess("Route deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete route.")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateRouteStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toastSuccess("Status updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update status.")),
  });

  const handleDelete = async (r: RouteItem) => {
    const ok = await confirmDelete(r.name);
    if (ok) removeMutation.mutate(r.id);
  };

  const handleStatusChange = async (route: RouteItem) => {
    if (!can("routes.update")) return;
    const choice = await promptChangeStatus(route.name, ROUTE_STATUS_OPTIONS, route.status);
    if (choice === false || choice === route.status) return;
    statusMutation.mutate({ id: route.id, status: choice });
  };

  const columns: Column<RouteItem>[] = [
    idColumn("code", (r) => r.code),
    {
      key: "name",
      header: "Route",
      primary: true,
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-400">{r.school?.name ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge className="bg-brand-accent-light text-brand-accent-dark">
          {TYPE_LABELS[r.type] ?? titleCase(r.type)}
        </Badge>
      ),
    },
    { key: "school", header: "School", render: (r) => r.school?.name ?? "—" },
    { key: "runs_count", header: "Runs", render: (r) => r.runs_count ?? 0 },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => (
        <StatusChip
          status={r.status}
          onClick={can("routes.update") ? () => handleStatusChange(r) : undefined}
          disabled={statusMutation.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Routes"
        description="Transportation routes and their scheduled runs."
        action={can("routes.create") && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add route</Button>
        )}
      />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search routes…"
        resultCount={data?.total}
        onClear={() => { setSearch(""); setType(""); setPage(1); }}
        filters={[{
          key: "type",
          label: "Route type",
          value: type,
          onChange: (v) => { setType(v); setPage(1); },
          options: TYPE_OPTIONS,
        }]}
      />

      <ActiveFilterPills
        items={[
          ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
          ...(type ? [{ key: "type", label: `Type: ${TYPE_LABELS[type] ?? type}` }] : []),
        ]}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "type") setType("");
          setPage(1);
        }}
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No routes match your filters."
      >
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
          actions={(r) => (
            <RowActions
              items={[
                { label: "View details", onClick: () => { setViewingId(r.id); setViewingName(r.name); } },
                { label: "Edit", onClick: () => { setEditing(r); setModalOpen(true); }, hidden: !can("routes.update") },
                { label: "Change status", onClick: () => handleStatusChange(r), hidden: !can("routes.update") },
                { label: "Delete", variant: "danger", onClick: () => handleDelete(r), hidden: !can("routes.delete") },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
      )}

      <RouteDetailModal routeId={viewingId} fallbackName={viewingName} onClose={() => setViewingId(null)} />
      <RouteFormModal open={modalOpen} onClose={() => setModalOpen(false)} route={editing} />
    </div>
  );
}
