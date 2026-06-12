"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Button, Badge } from "@/components/ui/primitives";
import { StatusChip } from "@/components/dashboard/status-chip";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import type { DispatchRunRow } from "@/lib/types";
import { titleCase } from "@/lib/utils";

function formatTime(time: string | null | undefined) {
  if (!time) return "—";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m?.slice(0, 2) ?? "00"} ${ampm}`;
}

function formatServiceDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DispatchRunViewModal({
  open,
  run,
  serviceDate,
  onClose,
  onAssign,
}: {
  open: boolean;
  run: DispatchRunRow | null;
  serviceDate: string;
  onClose: () => void;
  onAssign?: () => void;
}) {
  if (!run) return null;

  const assigned = run.assignment;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={run.name}
      description={`${formatServiceDate(serviceDate)} · ${formatTime(run.scheduled_start_time)} – ${formatTime(run.scheduled_end_time)}`}
      size="md"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {run.route?.id && (
            <Link href={`/dashboard/routes?id=${run.route.id}`}>
              <Button variant="secondary">Open route</Button>
            </Link>
          )}
          {onAssign && (
            <Button onClick={onAssign}>{assigned ? "Change assignment" : "Assign run"}</Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {assigned ? <StatusChip status={assigned.status} /> : <Badge className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">Unassigned</Badge>}
          {run.direction ? (
            <span className="text-xs text-slate-500">{titleCase(run.direction.replace(/_/g, " "))}</span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Route</p>
            <p className="mt-1 font-semibold text-slate-900">{run.route?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">{run.route?.school?.name ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Schedule</p>
            <p className="mt-1 font-semibold tabular-nums text-slate-900">
              {formatTime(run.scheduled_start_time)} – {formatTime(run.scheduled_end_time)}
            </p>
            <p className="text-xs text-slate-500">{formatServiceDate(serviceDate)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Driver</p>
            {assigned?.driver ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">
                  {assigned.driver.first_name} {assigned.driver.last_name}
                </p>
                {assigned.driver.employee_id ? (
                  <p className="text-xs text-slate-500">{assigned.driver.employee_id}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-slate-400">Not assigned</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Vehicle</p>
            {assigned?.vehicle ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">{assigned.vehicle.vehicle_number}</p>
                <p className="text-xs text-slate-500">{formatVehicleType(assigned.vehicle.type)}</p>
              </>
            ) : (
              <p className="mt-1 text-slate-400">Not assigned</p>
            )}
          </div>
        </div>

        {assigned?.notes ? (
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Dispatch notes</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{assigned.notes}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
