"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FleetRadarMap } from "@/components/dashboard/fleet-radar-map";
import { StatusChip } from "@/components/dashboard/status-chip";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { Badge, Button } from "@/components/ui/primitives";
import { getParentTracking } from "@/lib/resources";
import { cn, titleCase } from "@/lib/utils";
import type { FleetLiveVehicle, ParentTrack } from "@/lib/types";

const POLL_MS = 12_000;

function trackToVehicle(track: ParentTrack): FleetLiveVehicle | null {
  if (!track.vehicle) return null;

  return {
    id: track.vehicle.id,
    vehicle_number: track.vehicle.vehicle_number,
    type: track.vehicle.type,
    status: track.vehicle.status,
    license_plate: track.vehicle.license_plate,
    latitude: track.vehicle.latitude,
    longitude: track.vehicle.longitude,
    heading: track.vehicle.heading,
    speed_mph: track.vehicle.speed_mph,
    recorded_at: track.vehicle.recorded_at,
    is_simulated: track.vehicle.is_simulated,
    route: track.run
      ? {
          id: track.run.id,
          name: track.run.route_name ?? track.run.name,
          code: null,
          type: track.run.route_type ?? "am",
          status: "active",
          school_id: track.school?.id ?? null,
          school_name: track.school?.name ?? null,
          school_code: track.school?.code ?? null,
          run: {
            id: track.run.id,
            name: track.run.name,
            scheduled_start: track.run.scheduled_start_time,
            scheduled_end: track.run.scheduled_end_time,
            direction: track.run.direction,
            estimated_miles: null,
            status: track.run.status,
          },
          assignment_status: track.run.status,
        }
      : null,
    driver: track.vehicle.driver
      ? {
          id: track.vehicle.driver.id,
          first_name: track.vehicle.driver.first_name,
          last_name: track.vehicle.driver.last_name,
          employee_id: track.vehicle.driver.employee_id ?? null,
          phone: track.vehicle.driver.phone ?? null,
          email: null,
          status: "active",
          students_count: 0,
        }
      : null,
  };
}

function trackingLabel(status: ParentTrack["tracking_status"]) {
  switch (status) {
    case "in_progress":
      return "Live on route";
    case "scheduled":
      return "Scheduled today";
    case "assigned":
      return "Driver assigned";
    default:
      return "Not available";
  }
}

function formatUpdatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function ParentLiveTracker({
  focusStudentId,
  onFocusHandled,
}: {
  focusStudentId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["parent-tracking"],
    queryFn: getParentTracking,
    refetchInterval: POLL_MS,
  });

  const tracks = data?.tracks ?? [];

  useEffect(() => {
    if (!tracks.length) return;
    if (focusStudentId && tracks.some((t) => t.student_id === focusStudentId)) {
      setSelectedStudentId(focusStudentId);
      setFitKey((k) => k + 1);
      onFocusHandled?.();
      return;
    }
    if (!selectedStudentId || !tracks.some((t) => t.student_id === selectedStudentId)) {
      const firstWithBus = tracks.find((t) => t.vehicle) ?? tracks[0];
      setSelectedStudentId(firstWithBus?.student_id ?? null);
    }
  }, [tracks, focusStudentId, onFocusHandled, selectedStudentId]);

  const selectedTrack = tracks.find((t) => t.student_id === selectedStudentId) ?? null;
  const vehicles = useMemo(
    () => tracks.map(trackToVehicle).filter((v): v is FleetLiveVehicle => v !== null),
    [tracks],
  );
  const selectedVehicleId = selectedTrack?.vehicle?.id ?? null;
  const center = data?.center ?? { lat: 39.7817, lng: -89.6501 };

  return (
    <section id="live-tracking" className="fp-panel overflow-hidden">
      <div className="h-0.5 bg-brand-primary" />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-brand-secondary">Live bus tracking</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            See where your child&apos;s bus is on the map. Updates every few seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <span className="text-xs text-slate-400">Refreshing…</span>
          )}
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {tracks.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-2.5 sm:px-5">
          {tracks.map((track) => (
            <button
              key={track.student_id}
              type="button"
              onClick={() => {
                setSelectedStudentId(track.student_id);
                setFitKey((k) => k + 1);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                selectedStudentId === track.student_id
                  ? "bg-brand-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {track.student_name}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">Loading map…</div>
      )}

      {isError && (
        <div className="flex h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-slate-600">Could not load live tracking.</p>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="relative h-[min(52vh,420px)] min-h-[320px]">
            <FleetRadarMap
              vehicles={vehicles}
              center={center}
              selectedId={selectedVehicleId}
              onSelect={(vehicle) => {
                const match = tracks.find((t) => t.vehicle?.id === vehicle.id);
                if (match) setSelectedStudentId(match.student_id);
              }}
              fitKey={fitKey}
              followSelected
              showSweep={false}
            />
          </div>

          {selectedTrack && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-secondary">{selectedTrack.student_name}</p>
                  {selectedTrack.run && (
                    <p className="mt-0.5 text-xs text-slate-600">
                      {selectedTrack.run.name}
                      {selectedTrack.run.route_type
                        ? ` · ${titleCase(selectedTrack.run.route_type)} route`
                        : ""}
                    </p>
                  )}
                </div>
                <Badge
                  className={cn(
                    selectedTrack.tracking_status === "in_progress"
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      : selectedTrack.tracking_status === "unavailable"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
                  )}
                >
                  {trackingLabel(selectedTrack.tracking_status)}
                </Badge>
              </div>

              {selectedTrack.vehicle ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Bus</p>
                    <p className="font-semibold text-slate-900">{selectedTrack.vehicle.vehicle_number}</p>
                    <p className="text-xs text-slate-500">{formatVehicleType(selectedTrack.vehicle.type)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Speed</p>
                    <p className="font-semibold tabular-nums text-slate-900">
                      {Math.round(selectedTrack.vehicle.speed_mph)} mph
                    </p>
                    {selectedTrack.run && (
                      <div className="mt-1">
                        <StatusChip status={selectedTrack.run.status} />
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Last update</p>
                    <p className="font-semibold tabular-nums text-slate-900">
                      {formatUpdatedAt(selectedTrack.vehicle.recorded_at)}
                    </p>
                    {selectedTrack.vehicle.is_simulated && (
                      <p className="mt-0.5 text-[10px] text-slate-400">Demo GPS position</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No bus is assigned yet for today. Check back closer to pickup time or contact your school
                  transportation office.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
