"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions, type ActionMenuItem } from "@/components/ui/row-actions";
import { DispatchStatRow } from "@/components/dashboard/resource-stat-rows";
import { DispatchServiceDateCard } from "@/components/dashboard/dispatch-service-date-card";
import { DispatchRunViewModal } from "@/components/dashboard/dispatch-run-view-modal";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { FormLabel } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { StatusChip } from "@/components/dashboard/status-chip";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { CreateDispatchRunModal } from "@/components/dashboard/create-dispatch-run-modal";
import { toastError, toastSuccess, confirmCancelAssignment } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  assignDispatchRun,
  cancelDispatchAssignment,
  getDispatchRuns,
  listContractors,
  listDrivers,
  listSchools,
  listVehicles,
  updateDispatchAssignment,
} from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth";
import { buildVehicleSelectOptions } from "@/lib/picker-options";
import { cn, titleCase } from "@/lib/utils";
import { idColumn } from "@/lib/table-utils";
import type { DispatchRunRow } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

const ROUTE_TYPE_OPTIONS = [
  { label: "Morning (AM)", value: "am" },
  { label: "Afternoon (PM)", value: "pm" },
  { label: "Midday", value: "midday" },
  { label: "Activity", value: "activity" },
  { label: "Special Ed", value: "sped" },
  { label: "Charter", value: "charter" },
];

const ASSIGNMENT_OPTIONS = [
  { label: "Unassigned", value: "unassigned" },
  { label: "Assigned", value: "assigned" },
  { label: "Delegated", value: "delegated" },
];

const STATUS_OPTIONS = [
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(time: string | null | undefined) {
  if (!time) return "—";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m?.slice(0, 2) ?? "00"} ${ampm}`;
}

function directionLabel(direction: string | null | undefined) {
  if (direction === "to_school") return "To School";
  if (direction === "from_school") return "From School";
  return direction ? titleCase(direction.replace(/_/g, " ")) : "—";
}

function AssignRunModal({
  open,
  run,
  serviceDate,
  isContractor,
  canDelegate,
  onClose,
  onSaved,
}: {
  open: boolean;
  run: DispatchRunRow | null;
  serviceDate: string;
  isContractor: boolean;
  canDelegate: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"driver" | "delegate">("driver");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: driversPage, isLoading: driversLoading } = useQuery({
    queryKey: ["drivers", "dispatch-eligible"],
    queryFn: () => listDrivers({ dispatch_eligible: true, per_page: 100, sort_by: "last_name", sort_dir: "asc" }),
    enabled: open,
  });

  const { data: vehiclesPage, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles", "dispatch-active"],
    queryFn: () => listVehicles({ status: "active", per_page: 100, sort_by: "vehicle_number", sort_dir: "asc" }),
    enabled: open,
  });

  const { data: contractorsPage, isLoading: contractorsLoading } = useQuery({
    queryKey: ["contractors", "dispatch-delegate"],
    queryFn: () => listContractors({ is_active: true, per_page: 100, sort_by: "first_name", sort_dir: "asc" }),
    enabled: open && canDelegate && !isContractor,
  });

  const drivers = driversPage?.data ?? [];
  const vehicles = vehiclesPage?.data ?? [];
  const contractors = contractorsPage?.data ?? [];

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        label: `${d.first_name} ${d.last_name}${d.employee_id ? ` · ${d.employee_id}` : ""}`,
        value: d.id,
      })),
    [drivers],
  );

  const contractorOptions = useMemo(
    () =>
      contractors.map((c) => ({
        label: `${c.first_name} ${c.last_name}${c.job_title ? ` · ${c.job_title}` : ""}`,
        value: c.id,
      })),
    [contractors],
  );

  const vehicleOptions = useMemo(
    () =>
      buildVehicleSelectOptions(
        vehicles,
        drivers,
        run?.assignment?.vehicle
          ? [
              {
                id: run.assignment.vehicle.id,
                vehicle_number: run.assignment.vehicle.vehicle_number,
                type: run.assignment.vehicle.type,
              },
            ]
          : [],
      ),
    [vehicles, drivers, run?.assignment?.vehicle],
  );

  const assignMutation = useMutation({
    mutationFn: () => {
      if (mode === "delegate") {
        return assignDispatchRun(run!.id, {
          service_date: serviceDate,
          contractor_id: contractorId,
          notes: notes.trim() || undefined,
        }).then((res) => res.assignment);
      }

      const payload = {
        driver_id: driverId,
        vehicle_id: vehicleId,
        notes: notes.trim() || undefined,
      };
      if (run?.assignment?.id) {
        return updateDispatchAssignment(run.assignment.id, payload).then((res) => res.data);
      }
      return assignDispatchRun(run!.id, {
        service_date: serviceDate,
        ...payload,
      }).then((res) => res.assignment);
    },
    onSuccess: () => {
      toastSuccess(
        mode === "delegate" ? "Run delegated" : run?.assignment ? "Assignment updated" : "Run assigned",
        mode === "delegate"
          ? "The contractor will assign their own driver and vehicle."
          : "Driver and vehicle saved for this service date.",
      );
      onSaved();
      onClose();
    },
    onError: (e) => toastError("Assignment failed", getApiErrorMessage(e, "Could not assign this run.")),
  });

  useEffect(() => {
    if (!open || !run) return;
    const existing = run.assignment;
    setDriverId(existing?.driver?.id ?? "");
    setVehicleId(existing?.vehicle?.id ?? "");
    setContractorId(existing?.contractor?.id ?? "");
    setNotes(existing?.notes ?? "");
    if (isContractor) {
      setMode("driver");
    } else {
      setMode(existing?.is_delegated && !existing?.driver ? "delegate" : "driver");
    }
  }, [open, run, isContractor]);

  const handleDriverChange = (id: string) => {
    setDriverId(id);
    const driver = drivers.find((d) => d.id === id);
    if (driver?.default_vehicle?.id) {
      setVehicleId(driver.default_vehicle.id);
    }
  };

  const submitDisabled =
    assignMutation.isPending ||
    (mode === "delegate" ? !contractorId : !driverId || !vehicleId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={run?.assignment ? "Update assignment" : "Assign run"}
      description={
        run
          ? `${run.name} · ${run.route?.name ?? "Route"} · ${formatTime(run.scheduled_start_time)} – ${formatTime(run.scheduled_end_time)}`
          : undefined
      }
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => assignMutation.mutate()} disabled={submitDisabled}>
            {assignMutation.isPending
              ? "Saving…"
              : mode === "delegate"
                ? "Delegate run"
                : run?.assignment
                  ? "Save update"
                  : "Assign run"}
          </Button>
        </div>
      }
    >
      {run && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
            <p className="font-semibold text-slate-900">{run.route?.school?.name ?? "—"}</p>
            <p className="mt-0.5 text-slate-600">
              {TYPE_LABELS[run.route?.type ?? ""] ?? run.route?.type} · {directionLabel(run.direction)} ·{" "}
              {serviceDate}
            </p>
          </div>

          {canDelegate && !isContractor && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("driver")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  mode === "driver" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                Assign driver
              </button>
              <button
                type="button"
                onClick={() => setMode("delegate")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  mode === "delegate" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                Delegate to contractor
              </button>
            </div>
          )}

          {mode === "delegate" ? (
            <>
              <div>
                <FormLabel hint="(active contractors)">Contractor</FormLabel>
                <SearchableSelect
                  value={contractorId}
                  onChange={setContractorId}
                  options={contractorOptions}
                  placeholder={contractorsLoading ? "Loading contractors…" : "Select contractor"}
                  showAllOption={false}
                />
                {!contractorsLoading && contractors.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    No active contractors yet. Approve or create a contractor first.
                  </p>
                )}
              </div>
              <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 ring-1 ring-violet-100">
                The contractor assigns their own driver and vehicle. The school, parents, and you will see ride
                status exactly like a direct assignment.
              </p>
            </>
          ) : (
            <>
              <div>
                <FormLabel hint={isContractor ? "(your drivers)" : "(approved & active only)"}>Driver</FormLabel>
                <SearchableSelect
                  value={driverId}
                  onChange={handleDriverChange}
                  options={driverOptions}
                  placeholder={driversLoading ? "Loading drivers…" : "Select driver"}
                  showAllOption={false}
                />
                {!driversLoading && drivers.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    No eligible drivers. Approve user accounts and set driver status to active.
                  </p>
                )}
              </div>

              <div>
                <FormLabel>Vehicle</FormLabel>
                <SearchableSelect
                  value={vehicleId}
                  onChange={setVehicleId}
                  options={vehicleOptions}
                  placeholder={vehiclesLoading ? "Loading vehicles…" : "Select vehicle"}
                  unresolvedLabel="Select vehicle"
                  showAllOption={false}
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</label>
            <textarea
              className="fp-input min-h-[4.5rem] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional dispatch notes…"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

function formatScheduleDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildRunActions({
  run,
  canUpdate,
  onView,
  onAssign,
  onCancel,
  onOpenRoute,
  onOpenRadar,
}: {
  run: DispatchRunRow;
  canUpdate: boolean;
  onView: () => void;
  onAssign: () => void;
  onCancel: () => void;
  onOpenRoute: () => void;
  onOpenRadar: () => void;
}): ActionMenuItem[] {
  const assigned = run.assignment;
  const canCancel =
    canUpdate &&
    assigned &&
    assigned.status !== "in_progress" &&
    assigned.status !== "completed";

  return [
    { label: "View Details", onClick: onView },
    {
      label: assigned?.driver ? "Change driver & vehicle" : "Assign driver & vehicle",
      onClick: onAssign,
      hidden: !canUpdate,
    },
    { label: "Open Route & Runs", onClick: onOpenRoute, hidden: !run.route?.id },
    {
      label: "Track on Live Radar",
      onClick: onOpenRadar,
      hidden: !assigned?.vehicle,
    },
    {
      label: "Cancel Assignment",
      variant: "danger",
      onClick: onCancel,
      hidden: !canCancel,
    },
  ];
}

export default function DispatchPage() {
  const router = useRouter();
  const can = usePermission();
  const user = useAuthStore((s) => s.user);
  const isSchoolContact = user?.role === "school_contact";
  const isContractor = user?.role === "contractor";
  const canDispatch = can("routes.update") || can("runs.update");
  const canDelegate = !isContractor && !isSchoolContact && can("routes.update");
  const queryClient = useQueryClient();
  const [serviceDate, setServiceDate] = useState(todayIso);
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState("");
  const [routeType, setRouteType] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignRun, setAssignRun] = useState<DispatchRunRow | null>(null);
  const [viewRun, setViewRun] = useState<DispatchRunRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: schoolsPage } = useQuery({
    queryKey: ["schools", "dispatch-filter"],
    queryFn: () => listSchools({ per_page: 200, sort_by: "name", sort_dir: "asc" }),
  });

  const schoolOptions = useMemo(
    () => (schoolsPage?.data ?? []).map((s) => ({ label: s.name, value: s.id, sublabel: s.code ?? undefined })),
    [schoolsPage?.data],
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dispatch-runs", serviceDate, search, assignment, routeType, schoolId, statusFilter],
    queryFn: () =>
      getDispatchRuns({
        date: serviceDate,
        search: search || undefined,
        assignment: assignment as "" | "assigned" | "unassigned" | "delegated",
        route_type: routeType || undefined,
        school_id: schoolId || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const initialLoading = isLoading && !data;

  const cancelMutation = useMutation({
    mutationFn: cancelDispatchAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-runs"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-live"] });
      toastSuccess("Assignment cancelled");
    },
    onError: (e) => toastError("Cancel failed", getApiErrorMessage(e, "Could not cancel assignment.")),
  });

  const handleCancelAssignment = async (run: DispatchRunRow) => {
    const assignmentId = run.assignment?.id;
    if (!assignmentId) return;

    const ok = await confirmCancelAssignment(run.name, serviceDate);
    if (ok) cancelMutation.mutate(assignmentId);
  };

  const runHandlers = (run: DispatchRunRow) => ({
    onView: () => setViewRun(run),
    onAssign: () => setAssignRun(run),
    onCancel: () => void handleCancelAssignment(run),
    onOpenRoute: () => {
      if (run.route?.id) router.push(`/dashboard/routes?id=${run.route.id}`);
    },
    onOpenRadar: () => router.push("/dashboard/radar"),
  });

  const runs = data?.runs ?? [];
  const summary = data?.summary ?? { total: 0, assigned: 0, unassigned: 0, in_progress: 0 };
  const resultCount = data?.filtered_total ?? runs.length;

  const clearFilters = () => {
    setSearch("");
    setAssignment("");
    setRouteType("");
    setSchoolId("");
    setStatusFilter("");
  };

  const activePills = [
    ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
    ...(assignment ? [{ key: "assignment", label: assignment === "unassigned" ? "Unassigned" : "Assigned" }] : []),
    ...(routeType ? [{ key: "route_type", label: `Type: ${TYPE_LABELS[routeType] ?? routeType}` }] : []),
    ...(schoolId
      ? [{ key: "school_id", label: `School: ${schoolOptions.find((s) => s.value === schoolId)?.label ?? schoolId}` }]
      : []),
    ...(statusFilter ? [{ key: "status", label: `Status: ${titleCase(statusFilter.replace(/_/g, " "))}` }] : []),
  ];

  const columns: Column<DispatchRunRow>[] = useMemo(
    () => [
      idColumn("route_code", (run) => run.route?.code ?? run.id.slice(0, 8).toUpperCase()),
      {
        key: "name",
        header: "Run",
        primary: true,
        sortable: true,
        sortValue: (run) => run.name,
        render: (run) => (
          <div>
            <p className="font-semibold text-slate-900">{run.name}</p>
            <p className="text-xs text-slate-500">{directionLabel(run.direction)}</p>
          </div>
        ),
      },
      {
        key: "route",
        header: "Route / school",
        sortable: true,
        sortValue: (run) => run.route?.name ?? "",
        render: (run) => (
          <div>
            <p className="font-medium text-slate-800">{run.route?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">
              {run.route?.school?.name ?? "—"}
              {run.route?.type ? ` · ${TYPE_LABELS[run.route.type] ?? run.route.type}` : ""}
            </p>
          </div>
        ),
      },
      {
        key: "time",
        header: "Schedule",
        sortable: true,
        sortValue: (run) => run.scheduled_start_time ?? "",
        render: (run) => (
          <div className="text-slate-700">
            <p className="text-xs font-medium text-slate-500">{formatScheduleDate(serviceDate)}</p>
            <p className="tabular-nums">
              {formatTime(run.scheduled_start_time)} – {formatTime(run.scheduled_end_time)}
            </p>
          </div>
        ),
      },
      {
        key: "driver",
        header: "Driver",
        sortable: true,
        sortValue: (run) =>
          run.assignment?.driver
            ? `${run.assignment.driver.last_name} ${run.assignment.driver.first_name}`
            : "",
        render: (run) =>
          run.assignment?.driver ? (
            <div>
              <p className="font-medium text-slate-900">
                {run.assignment.driver.first_name} {run.assignment.driver.last_name}
              </p>
              {run.assignment.contractor ? (
                <p className="text-xs text-violet-600">via {run.assignment.contractor.name}</p>
              ) : run.assignment.driver.employee_id ? (
                <p className="text-xs text-slate-500">{run.assignment.driver.employee_id}</p>
              ) : null}
            </div>
          ) : run.assignment?.awaiting_driver ? (
            <div>
              <p className="font-medium text-violet-700">{run.assignment.contractor?.name ?? "Contractor"}</p>
              <p className="text-xs text-slate-500">Awaiting their driver</p>
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: "vehicle",
        header: "Vehicle",
        hideOnMobile: true,
        sortable: true,
        sortValue: (run) => run.assignment?.vehicle?.vehicle_number ?? "",
        render: (run) =>
          run.assignment?.vehicle ? (
            <div>
              <p className="font-medium text-slate-900">{run.assignment.vehicle.vehicle_number}</p>
              <p className="text-xs text-slate-500">{formatVehicleType(run.assignment.vehicle.type)}</p>
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        sortValue: (run) => run.assignment?.status ?? "unassigned",
        render: (run) =>
          run.assignment?.awaiting_driver ? (
            <Badge className="bg-violet-50 text-violet-700 ring-1 ring-violet-200">Delegated</Badge>
          ) : run.assignment ? (
            <StatusChip status={run.assignment.status} />
          ) : (
            <Badge className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">Unassigned</Badge>
          ),
      },
    ],
    [serviceDate],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSchoolContact ? "Runs today" : "Today's dispatch"}
        description={
          isSchoolContact
            ? "View assigned runs, drivers, and vehicles serving your school today. Read-only — contact transportation to make changes."
            : "Create runs, assign drivers and vehicles, and monitor today's service board."
        }
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {can("routes.update") && (
              <Button onClick={() => setCreateOpen(true)}>+ Create Run</Button>
            )}
            <Link href="/dashboard/radar" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                Live radar
              </Button>
            </Link>
            {canDispatch && summary.unassigned > 0 && (
              <Button variant="primary" className="w-full sm:w-auto" onClick={() => setAssignment("unassigned")}>
                {summary.unassigned} need assignment
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-[1fr_12.5rem]">
        <DispatchStatRow summary={summary} isLoading={initialLoading} />
        <DispatchServiceDateCard value={serviceDate} onChange={setServiceDate} className="lg:justify-self-end" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search run, route, driver, vehicle, or school…"
        resultCount={resultCount}
        onClear={clearFilters}
        filters={[
          {
            key: "assignment",
            label: "Assignment",
            value: assignment,
            onChange: setAssignment,
            options: ASSIGNMENT_OPTIONS,
          },
          {
            key: "status",
            label: "Run Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: STATUS_OPTIONS,
          },
          {
            key: "route_type",
            label: "Route Type",
            value: routeType,
            onChange: setRouteType,
            options: ROUTE_TYPE_OPTIONS,
          },
          ...(!isSchoolContact
            ? [
                {
                  key: "school_id",
                  label: "School",
                  value: schoolId,
                  onChange: setSchoolId,
                  options: schoolOptions,
                },
              ]
            : []),
        ]}
      />

      <ActiveFilterPills
        items={activePills}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "assignment") setAssignment("");
          if (key === "route_type") setRouteType("");
          if (key === "school_id") setSchoolId("");
          if (key === "status") setStatusFilter("");
        }}
      />

      {isFetching && !initialLoading && (
        <p className="text-xs text-slate-400">Updating dispatch board…</p>
      )}

      <PageState
        isLoading={initialLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!initialLoading && !isError && runs.length === 0}
        emptyMessage={
          summary.total === 0
            ? "No active runs scheduled for this day. Check routes and run templates."
            : "No runs match your filters."
        }
      >
        <div className={cn("transition-opacity", isFetching && "opacity-90")}>
          <DataTable
            columns={columns}
            rows={runs}
            rowKey={(run) => run.id}
            defaultSortKey="time"
            defaultSortDir="asc"
            emptyMessage="No runs match your filters."
            actions={(run) => {
              const handlers = runHandlers(run);
              return (
                <RowActions
                  items={buildRunActions({
                    run,
                    canUpdate: canDispatch,
                    ...handlers,
                  })}
                />
              );
            }}
          />
        </div>
      </PageState>

      <CreateDispatchRunModal
        open={createOpen}
        serviceDate={serviceDate}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["dispatch-runs"] });
          queryClient.invalidateQueries({ queryKey: ["fleet-live"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["route-stats"] });
        }}
      />

      <DispatchRunViewModal
        open={!!viewRun}
        run={viewRun}
        serviceDate={serviceDate}
        onClose={() => setViewRun(null)}
        onAssign={
          viewRun && canDispatch
            ? () => {
                setAssignRun(viewRun);
                setViewRun(null);
              }
            : undefined
        }
      />

      <AssignRunModal
        open={!!assignRun}
        run={assignRun}
        serviceDate={serviceDate}
        isContractor={isContractor}
        canDelegate={canDelegate}
        onClose={() => setAssignRun(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["dispatch-runs"] });
          queryClient.invalidateQueries({ queryKey: ["fleet-live"] });
        }}
      />
    </div>
  );
}
