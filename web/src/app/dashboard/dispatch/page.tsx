"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { StatusChip } from "@/components/dashboard/status-chip";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  assignDispatchRun,
  cancelDispatchAssignment,
  getDispatchRuns,
  listDrivers,
  listVehicles,
  updateDispatchAssignment,
} from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { cn, titleCase } from "@/lib/utils";
import type { DispatchRunRow } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

type FilterTab = "all" | "unassigned" | "assigned" | "in_progress";

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
  if (direction === "to_school") return "To school";
  if (direction === "from_school") return "From school";
  return direction ? titleCase(direction.replace(/_/g, " ")) : "—";
}

function SummaryPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums" style={{ color: accent ?? "#18181b" }}>
        {value}
      </p>
    </div>
  );
}

function AssignRunModal({
  open,
  run,
  serviceDate,
  onClose,
  onSaved,
}: {
  open: boolean;
  run: DispatchRunRow | null;
  serviceDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
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

  const drivers = driversPage?.data ?? [];
  const vehicles = vehiclesPage?.data ?? [];

  const driverOptions = useMemo(
    () =>
      drivers.map((d) => ({
        label: `${d.first_name} ${d.last_name}${d.employee_id ? ` · ${d.employee_id}` : ""}`,
        value: d.id,
      })),
    [drivers],
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        label: `${v.vehicle_number} · ${formatVehicleType(v.type)}`,
        value: v.id,
      })),
    [vehicles],
  );

  const assignMutation = useMutation({
    mutationFn: () => {
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
        run?.assignment ? "Assignment updated" : "Run assigned",
        "Driver and vehicle saved for this service date.",
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
    setNotes(existing?.notes ?? "");
  }, [open, run]);

  const handleDriverChange = (id: string) => {
    setDriverId(id);
    const driver = drivers.find((d) => d.id === id);
    if (driver?.default_vehicle?.id) {
      setVehicleId(driver.default_vehicle.id);
    }
  };

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
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={!driverId || !vehicleId || assignMutation.isPending}
          >
            {assignMutation.isPending ? "Saving…" : run?.assignment ? "Save update" : "Assign run"}
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

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Driver <span className="font-normal normal-case text-slate-400">(approved & active only)</span>
            </label>
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
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Vehicle</label>
            <SearchableSelect
              value={vehicleId}
              onChange={setVehicleId}
              options={vehicleOptions}
              placeholder={vehiclesLoading ? "Loading vehicles…" : "Select vehicle"}
              showAllOption={false}
            />
          </div>

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

export default function DispatchPage() {
  const can = usePermission();
  const queryClient = useQueryClient();
  const [serviceDate, setServiceDate] = useState(todayIso);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [assignRun, setAssignRun] = useState<DispatchRunRow | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dispatch-runs", serviceDate],
    queryFn: () => getDispatchRuns(serviceDate),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelDispatchAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-runs"] });
      queryClient.invalidateQueries({ queryKey: ["fleet-live"] });
      toastSuccess("Assignment cancelled");
    },
    onError: (e) => toastError("Cancel failed", getApiErrorMessage(e, "Could not cancel assignment.")),
  });

  const filteredRuns = useMemo(() => {
    const runs = data?.runs ?? [];
    switch (filter) {
      case "unassigned":
        return runs.filter((r) => !r.assignment);
      case "assigned":
        return runs.filter((r) => r.assignment);
      case "in_progress":
        return runs.filter((r) => r.assignment?.status === "in_progress");
      default:
        return runs;
    }
  }, [data?.runs, filter]);

  const summary = data?.summary ?? { total: 0, assigned: 0, unassigned: 0, in_progress: 0 };

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All runs", count: summary.total },
    { id: "unassigned", label: "Unassigned", count: summary.unassigned },
    { id: "assigned", label: "Assigned", count: summary.assigned },
    { id: "in_progress", label: "In progress", count: summary.in_progress },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's dispatch"
        description="Assign drivers and vehicles to scheduled runs. Only approved, active drivers appear in the picker."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/radar">
              <Button variant="secondary">Live radar</Button>
            </Link>
            {can("routes.update") && summary.unassigned > 0 && (
              <Button variant="primary" onClick={() => setFilter("unassigned")}>
                {summary.unassigned} need assignment
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryPill label="Total runs" value={summary.total} />
          <SummaryPill label="Assigned" value={summary.assigned} accent="#059669" />
          <SummaryPill label="Unassigned" value={summary.unassigned} accent="#d97706" />
          <SummaryPill label="In progress" value={summary.in_progress} accent="#4f5ba9" />
        </div>
        <div className="sm:w-48">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Service date</label>
          <input
            type="date"
            className="fp-input"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === tab.id
                ? "bg-brand-primary text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums opacity-80">({tab.count})</span>
          </button>
        ))}
        {isFetching && !isLoading && (
          <span className="self-center text-xs text-slate-400">Refreshing…</span>
        )}
      </div>

      {isLoading && (
        <div className="fp-card flex flex-col items-center justify-center py-20">
          <p className="text-sm text-slate-500">Loading today&apos;s runs…</p>
        </div>
      )}
      {isError && (
        <div className="fp-card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-brand-secondary">Could not load dispatch board.</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="fp-card overflow-hidden">
          {filteredRuns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-800">No runs for this filter</p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.total === 0
                  ? "No active runs scheduled for this day. Check routes and run templates."
                  : "Try another filter or date."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Run</th>
                    <th className="px-4 py-3">Route / school</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((run) => {
                    const assigned = run.assignment;
                    const canCancel =
                      can("routes.update") &&
                      assigned &&
                      assigned.status !== "in_progress" &&
                      assigned.status !== "completed";

                    return (
                      <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{run.name}</p>
                          <p className="text-xs text-slate-500">{directionLabel(run.direction)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{run.route?.name ?? "—"}</p>
                          <p className="text-xs text-slate-500">
                            {run.route?.school?.name ?? "—"}
                            {run.route?.type ? ` · ${TYPE_LABELS[run.route.type] ?? run.route.type}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {formatTime(run.scheduled_start_time)} – {formatTime(run.scheduled_end_time)}
                        </td>
                        <td className="px-4 py-3">
                          {assigned?.driver ? (
                            <div>
                              <p className="font-medium text-slate-900">
                                {assigned.driver.first_name} {assigned.driver.last_name}
                              </p>
                              {assigned.driver.employee_id && (
                                <p className="text-xs text-slate-500">{assigned.driver.employee_id}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {assigned?.vehicle ? (
                            <div>
                              <p className="font-medium text-slate-900">{assigned.vehicle.vehicle_number}</p>
                              <p className="text-xs text-slate-500">{formatVehicleType(assigned.vehicle.type)}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {assigned ? (
                            <StatusChip status={assigned.status} />
                          ) : (
                            <Badge className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">Unassigned</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {can("routes.update") && (
                              <Button
                                size="sm"
                                variant={assigned ? "secondary" : "primary"}
                                onClick={() => setAssignRun(run)}
                              >
                                {assigned ? "Update" : "Assign"}
                              </Button>
                            )}
                            {canCancel && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelMutation.mutate(assigned!.id)}
                                disabled={cancelMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AssignRunModal
        open={!!assignRun}
        run={assignRun}
        serviceDate={serviceDate}
        onClose={() => setAssignRun(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["dispatch-runs"] });
          queryClient.invalidateQueries({ queryKey: ["fleet-live"] });
        }}
      />
    </div>
  );
}
