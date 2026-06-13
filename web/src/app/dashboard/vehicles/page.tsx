"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button } from "@/components/ui/primitives";
import { VehicleStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { VehicleDetailModal } from "@/components/dashboard/vehicle-detail-modal";
import { VehicleFormModal } from "@/components/dashboard/vehicle-form";
import { AssignmentChip, formatVehicleType } from "@/components/dashboard/assignment-ui";
import { StatusChip } from "@/components/dashboard/status-chip";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { promptAssignDriver } from "@/lib/assignment-alerts";
import { promptChangeStatus } from "@/lib/status-alerts";
import { VEHICLE_STATUS_OPTIONS } from "@/lib/status-options";
import { getApiErrorMessage } from "@/lib/api";
import { assignVehicleDriver, deleteVehicle, listDrivers, listVehicles, updateVehicleStatus } from "@/lib/resources";
import { buildDriverPickerOptions } from "@/lib/picker-options";
import { usePermission } from "@/hooks/use-permission";
import { titleCase } from "@/lib/utils";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { Vehicle } from "@/lib/types";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Out of Service", value: "out_of_service" },
  { label: "Retired", value: "retired" },
];

const TYPE_OPTIONS = [
  { label: "Bus", value: "bus" },
  { label: "Van", value: "van" },
  { label: "Minivan", value: "minivan" },
  { label: "Sedan", value: "sedan" },
  { label: "Wheelchair Van", value: "wheelchair_van" },
];

const ASSIGNMENT_OPTIONS = [
  { label: "Has Driver", value: "assigned" },
  { label: "No Driver", value: "unassigned" },
];

export default function VehiclesPage() {
  const can = usePermission();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [assignment, setAssignment] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("vehicle_number");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingName, setViewingName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const canAssign = can("vehicles.update") || can("drivers.update");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", { search, status, type, assignment, page, sortKey, sortDir }],
    queryFn: () => listVehicles({ search, status, type, assignment: assignment as "" | "assigned" | "unassigned", page, ...sortParams }),
  });

  const { data: driversData } = useQuery({
    queryKey: ["drivers", "all-for-assignment"],
    queryFn: () => listDrivers({ status: "active", per_page: 200 }),
  });

  const driverOptions = useMemo(
    () => buildDriverPickerOptions(driversData?.data ?? []),
    [driversData],
  );

  const assignMutation = useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string | null }) =>
      assignVehicleDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toastSuccess("Assignment updated", "Driver assignment saved.");
    },
    onError: (e) => toastError("Assignment failed", getApiErrorMessage(e, "Could not update assignment.")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateVehicleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess("Status updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update status.")),
  });

  const removeMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess("Vehicle deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete vehicle.")),
  });

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setType("");
    setAssignment("");
    setPage(1);
  };

  const handleDelete = async (v: Vehicle) => {
    const ok = await confirmDelete(v.vehicle_number);
    if (ok) removeMutation.mutate(v.id);
  };

  const handleAssignDriver = async (vehicle: Vehicle) => {
    if (!canAssign) return;
    const choice = await promptAssignDriver(
      vehicle.vehicle_number,
      driverOptions,
      vehicle.assigned_driver?.id,
    );
    if (choice === false) return;
    assignMutation.mutate({ vehicleId: vehicle.id, driverId: choice });
  };

  const handleStatusChange = async (vehicle: Vehicle) => {
    if (!can("vehicles.update")) return;
    const choice = await promptChangeStatus(vehicle.vehicle_number, VEHICLE_STATUS_OPTIONS, vehicle.status);
    if (choice === false || choice === vehicle.status) return;
    statusMutation.mutate({ id: vehicle.id, status: choice });
  };

  const columns: Column<Vehicle>[] = [
    idColumn("vehicle_number", (v) => v.vehicle_number),
    {
      key: "vehicle",
      header: "Vehicle",
      primary: true,
      sortable: true,
      sortValue: (v) => v.vehicle_number,
      render: (v) => (
        <div>
          <p className="font-medium text-slate-900">{formatVehicleType(v.type)}</p>
          <p className="text-xs text-slate-400">{`${v.make ?? ""} ${v.model ?? ""}`.trim() || "—"}</p>
        </div>
      ),
    },
    { key: "make", header: "Make / Model", render: (v) => `${v.make ?? "—"} ${v.model ?? ""}`.trim() },
    { key: "year", header: "Year", hideOnMobile: true, render: (v) => v.year ?? "—" },
    {
      key: "capacity",
      header: "Capacity",
      render: (v) => `${v.capacity ?? "—"}${v.wheelchair_capacity ? ` (+${v.wheelchair_capacity} WC)` : ""}`,
    },
    { key: "license_plate", header: "Plate", hideOnMobile: true, render: (v) => v.license_plate ?? "—" },
    {
      key: "assigned_driver",
      header: "Assigned driver",
      render: (v) => (
        <AssignmentChip
          label={v.assigned_driver ? `${v.assigned_driver.first_name} ${v.assigned_driver.last_name}` : null}
          sublabel={
            v.assigned_driver
              ? [v.assigned_driver.employee_id, v.assigned_driver.phone, v.assigned_driver.email].filter(Boolean).join(" · ")
              : undefined
          }
          emptyLabel="+ Assign driver"
          onClick={canAssign ? () => handleAssignDriver(v) : undefined}
          disabled={assignMutation.isPending}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (v) => v.status,
      render: (v) => (
        <StatusChip
          status={v.status}
          onClick={can("vehicles.update") ? () => handleStatusChange(v) : undefined}
          disabled={statusMutation.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vehicles"
        description="Fleet inventory, capacity, driver assignments, and service status."
        action={can("vehicles.create") && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Vehicle</Button>
        )}
      />

      <VehicleStatRow />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by number, make, or plate…"
        resultCount={data?.total}
        onClear={clearFilters}
        filters={[
          { key: "status", label: "Status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUS_OPTIONS },
          { key: "type", label: "Type", value: type, onChange: (v) => { setType(v); setPage(1); }, options: TYPE_OPTIONS },
          { key: "assignment", label: "Driver", value: assignment, onChange: (v) => { setAssignment(v); setPage(1); }, options: ASSIGNMENT_OPTIONS },
        ]}
      />

      <ActiveFilterPills
        items={[
          ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
          ...(status ? [{ key: "status", label: `Status: ${titleCase(status.replace(/_/g, " "))}` }] : []),
          ...(type ? [{ key: "type", label: `Type: ${formatVehicleType(type)}` }] : []),
          ...(assignment ? [{ key: "assignment", label: assignment === "assigned" ? "Has driver" : "No driver" }] : []),
        ]}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "status") setStatus("");
          if (key === "type") setType("");
          if (key === "assignment") setAssignment("");
          setPage(1);
        }}
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No vehicles match your filters."
      >
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(v) => v.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
          actions={(v) => (
            <RowActions
              items={[
                { label: "View Details", onClick: () => { setViewingId(v.id); setViewingName(v.vehicle_number); } },
                { label: "Assign Driver", onClick: () => handleAssignDriver(v), hidden: !canAssign },
                { label: "Change Status", onClick: () => handleStatusChange(v), hidden: !can("vehicles.update") },
                { label: "Edit", onClick: () => { setEditing(v); setModalOpen(true); }, hidden: !can("vehicles.update") },
                { label: "Delete", variant: "danger", onClick: () => handleDelete(v), hidden: !can("vehicles.delete") },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
      )}

      <VehicleDetailModal vehicleId={viewingId} fallbackName={viewingName} onClose={() => setViewingId(null)} />
      <VehicleFormModal open={modalOpen} onClose={() => setModalOpen(false)} vehicle={editing} />
    </div>
  );
}
