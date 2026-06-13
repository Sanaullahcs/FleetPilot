"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/primitives";
import { FleetRadarMap } from "@/components/dashboard/fleet-radar-map";
import { routeTypeLabel } from "@/components/dashboard/fleet-radar-icons";
import { StatusChip } from "@/components/dashboard/status-chip";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { ROUTE_TYPE_OPTIONS } from "@/components/dashboard/dashboard-analytics-filters";
import { getFleetLive, listDrivers } from "@/lib/resources";
import {
  RADAR_LIVE_POLL_MS,
  RADAR_SNAPSHOT_STALE_MS,
  readRadarLivePreference,
  writeRadarLivePreference,
} from "@/lib/radar-config";
import type { FleetLiveFilters, FleetLiveVehicle } from "@/lib/types";
import { DRIVER_STATUS_OPTIONS, VEHICLE_STATUS_OPTIONS } from "@/lib/status-options";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";

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

const MOVEMENT_OPTIONS = [
  { label: "Moving", value: "moving" },
  { label: "Idle", value: "idle" },
];

type Panel = "none" | "filters" | "fleet" | "detail";

function formatSpeed(mph: number) {
  return `${mph.toFixed(mph >= 10 ? 0 : 1)} mph`;
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
  return direction ?? "—";
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition",
        active
          ? "bg-brand-primary text-white"
          : "bg-white/90 text-slate-600 ring-1 ring-black/10 hover:bg-white",
      )}
    >
      {label}
    </button>
  );
}

function IconButton({
  label,
  active,
  onClick,
  children,
  badge,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition",
        active
          ? "bg-brand-primary text-white ring-1 ring-brand-primary/20"
          : "bg-white/95 text-brand-primary ring-1 ring-brand-primary/15 hover:bg-brand-primary/5",
      )}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3 gap-y-0.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function VehicleDetailContent({ vehicle, onClose }: { vehicle: FleetLiveVehicle; onClose: () => void }) {
  const driver = vehicle.driver;
  const route = vehicle.route;
  const run = route?.run;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Unit</p>
          <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{vehicle.vehicle_number}</h2>
          <p className="truncate text-sm text-slate-500">
            {formatVehicleType(vehicle.type)}
            {vehicle.license_plate ? ` · ${vehicle.license_plate}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] uppercase text-slate-400">Speed</p>
            <p className="text-lg font-bold tabular-nums">{formatSpeed(vehicle.speed_mph)}</p>
          </div>
          <div className="min-w-0 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] uppercase text-slate-400">Heading</p>
            <p className="text-lg font-bold tabular-nums">{Math.round(vehicle.heading)}°</p>
          </div>
          <div className="col-span-2 min-w-0 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] uppercase text-slate-400">Capacity</p>
            <p className="text-lg font-bold tabular-nums">{vehicle.capacity ?? "—"}</p>
          </div>
        </div>

        <StatusChip status={vehicle.status} />

        {route ? (
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Route</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{route.name}</p>
                {route.code && <p className="text-xs text-slate-500">{route.code}</p>}
              </div>
              <span className="shrink-0 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-brand-primary">
                {routeTypeLabel(route.type)}
              </span>
            </div>
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              <DetailRow label="School" value={route.school_name ?? "—"} />
              {run && (
                <>
                  <DetailRow label="Run" value={run.name} />
                  <DetailRow label="Schedule" value={`${formatTime(run.scheduled_start)} – ${formatTime(run.scheduled_end)}`} />
                  <DetailRow label="Direction" value={directionLabel(run.direction)} />
                  {run.estimated_miles != null && (
                    <DetailRow label="Est. distance" value={`${run.estimated_miles} mi`} />
                  )}
                </>
              )}
              {route.assignment_status && (
                <DetailRow
                  label="Assignment"
                  value={
                    <span className="capitalize">{route.assignment_status.replace(/_/g, " ")}</span>
                  }
                />
              )}
            </div>
            <Link
              href={`/dashboard/routes?id=${route.id}`}
              className="mt-3 inline-block text-xs font-semibold text-brand-primary hover:underline"
            >
              Open route →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No route assigned today</p>
        )}

        {driver ? (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Driver</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {driver.first_name} {driver.last_name}
            </p>
            {driver.employee_id && <p className="text-xs text-slate-500">ID {driver.employee_id}</p>}
            <div className="mt-3 space-y-2">
              {driver.phone && (
                <a href={`tel:${driver.phone}`} className="block text-sm text-brand-primary">
                  {driver.phone}
                </a>
              )}
              {driver.email && (
                <a href={`mailto:${driver.email}`} className="block truncate text-sm text-slate-600">
                  {driver.email}
                </a>
              )}
              {(driver.license_number || driver.license_class) && (
                <p className="text-xs text-slate-500">
                  License {driver.license_number ?? "—"}
                  {driver.license_class ? ` (${driver.license_class})` : ""}
                </p>
              )}
              <p className="text-xs text-slate-500">{driver.students_count} students assigned</p>
            </div>
            <Link
              href={`/dashboard/drivers?id=${driver.id}`}
              className="mt-3 inline-block text-xs font-semibold text-brand-primary hover:underline"
            >
              Open driver →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No driver assigned</p>
        )}

        {(vehicle.make || vehicle.model) && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="text-[10px] uppercase text-slate-400">Vehicle</p>
            <p className="font-medium text-slate-900">
              {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
            </p>
          </div>
        )}

        <Link href={`/dashboard/vehicles?id=${vehicle.id}`} className="text-xs font-semibold text-brand-primary hover:underline">
          Open vehicle →
        </Link>
      </div>
    </div>
  );
}

function FleetRow({ vehicle, onClick }: { vehicle: FleetLiveVehicle; onClick: () => void }) {
  const moving = vehicle.speed_mph >= 1;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-slate-50 px-5 py-3 text-left hover:bg-slate-50">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", moving ? "bg-emerald-500" : "bg-slate-300")} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{vehicle.vehicle_number}</span>
        <span className="block truncate text-xs text-slate-500">
          {vehicle.route?.name ?? "No route"} ·{" "}
          {vehicle.driver ? `${vehicle.driver.first_name} ${vehicle.driver.last_name}` : "Unassigned"} ·{" "}
          {formatSpeed(vehicle.speed_mph)}
        </span>
      </span>
    </button>
  );
}

export function FleetRadarView() {
  const user = useAuthStore((s) => s.user);
  const isSchoolContact = user?.role === "school_contact";
  const [mounted, setMounted] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const [followSelected, setFollowSelected] = useState(false);
  const [showSweep, setShowSweep] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [assignment, setAssignment] = useState<"" | "assigned" | "unassigned">("");
  const [driverStatus, setDriverStatus] = useState("");
  const [driverId, setDriverId] = useState("");
  const [movement, setMovement] = useState<"" | "moving" | "idle">("");
  const [routeType, setRouteType] = useState("");
  const [liveTracking, setLiveTracking] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted) setLiveTracking(readRadarLivePreference());
  }, [mounted]);

  const toggleLiveTracking = () => {
    setLiveTracking((prev) => {
      const next = !prev;
      writeRadarLivePreference(next);
      return next;
    });
  };

  useEffect(() => {
    if (liveTracking && mounted) void refetch();
  }, [liveTracking, mounted]); // eslint-disable-line react-hooks/exhaustive-deps -- refetch once when enabling live mode

  const deferredSearch = useDeferredValue(search);
  const queryFilters: FleetLiveFilters = useMemo(
    () => ({
      search: deferredSearch || undefined,
      status: status || undefined,
      type: type || undefined,
      assignment: assignment || undefined,
      driver_status: driverStatus || undefined,
      driver_id: driverId || undefined,
      movement: movement || undefined,
      route_type: routeType || undefined,
    }),
    [deferredSearch, status, type, assignment, driverStatus, driverId, movement, routeType],
  );

  const activeFilterCount = [status, type, assignment, driverStatus, driverId, movement, routeType, deferredSearch].filter(Boolean).length;

  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["fleet-live", queryFilters],
    queryFn: () => getFleetLive(queryFilters),
    refetchInterval: liveTracking ? RADAR_LIVE_POLL_MS : false,
    refetchOnWindowFocus: liveTracking,
    staleTime: liveTracking ? 0 : RADAR_SNAPSHOT_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: mounted,
  });

  const initialLoading = isLoading && !data;

  const { data: driversPage } = useQuery({
    queryKey: ["drivers", "radar-filter"],
    queryFn: () => listDrivers({ per_page: 100 }),
    enabled: mounted,
  });

  const driverOptions = useMemo(
    () =>
      (driversPage?.data ?? []).map((d) => ({
        label: `${d.first_name} ${d.last_name}`,
        value: d.id,
      })),
    [driversPage],
  );

  const vehicles = data?.vehicles ?? [];
  const center = data?.center ?? { lat: 39.7817, lng: -89.6501 };
  const selected = vehicles.find((v) => v.id === selectedId) ?? null;
  const movingCount = vehicles.filter((v) => v.speed_mph >= 1).length;

  const filteredList = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.vehicle_number.toLowerCase().includes(q) ||
        v.route?.name?.toLowerCase().includes(q) ||
        v.driver?.first_name.toLowerCase().includes(q) ||
        v.driver?.last_name.toLowerCase().includes(q),
    );
  }, [vehicles, listSearch]);

  const selectVehicle = (v: FleetLiveVehicle) => {
    setSelectedId(v.id);
    setPanel("detail");
    setFollowSelected(true);
  };

  const toggleMovement = (value: "" | "moving" | "idle") => {
    setMovement((m) => (m === value ? "" : value));
  };

  const toggleType = (value: string) => {
    setType((t) => (t === value ? "" : value));
  };

  const toggleRouteType = (value: string) => {
    setRouteType((r) => (r === value ? "" : value));
  };

  if (!mounted) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-slate-100">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <FleetRadarMap
        vehicles={vehicles}
        center={center}
        selectedId={selectedId}
        onSelect={selectVehicle}
        fitKey={fitKey}
        followSelected={followSelected && liveTracking}
        showSweep={showSweep}
        liveTracking={liveTracking}
        className="absolute inset-0"
      />

      {/* Top HUD — search + inline filters */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pr-28 sm:p-4 sm:pr-40">
        <div className="pointer-events-auto flex max-w-xl flex-col gap-2">
          {isSchoolContact ? (
            <p className="rounded-xl bg-white/95 px-4 py-2.5 text-xs leading-relaxed text-slate-600 ring-1 ring-black/5 backdrop-blur">
              Showing live vehicles on runs for your school and drivers assigned to your students only.
            </p>
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 ring-1 ring-black/5 backdrop-blur">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={cn(
                  "absolute h-full w-full rounded-full",
                  liveTracking ? "bg-emerald-500" : "bg-slate-400",
                  liveTracking && isFetching && "animate-ping opacity-60",
                )}
              />
              <span
                className={cn(
                  "relative h-2 w-2 rounded-full",
                  liveTracking ? "bg-emerald-500" : "bg-slate-400",
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900">Live radar</p>
              <p className="text-[10px] tabular-nums text-slate-500">
                {vehicles.length} units · {movingCount} moving
                {liveTracking ? ` · updates every ${RADAR_LIVE_POLL_MS / 1000}s` : " · snapshot mode"}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleLiveTracking}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                liveTracking
                  ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200",
              )}
              aria-pressed={liveTracking}
            >
              {liveTracking ? "Live on" : "Live off"}
            </button>
            {!liveTracking ? (
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-brand-primary hover:underline disabled:opacity-50"
              >
                Refresh
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 ring-1 ring-black/5 backdrop-blur">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-slate-400">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units, routes, drivers…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip label="All" active={!movement && !type && !routeType} onClick={() => { setMovement(""); setType(""); setRouteType(""); }} />
            <FilterChip label="Moving" active={movement === "moving"} onClick={() => toggleMovement("moving")} />
            <FilterChip label="Idle" active={movement === "idle"} onClick={() => toggleMovement("idle")} />
            <FilterChip label="Bus" active={type === "bus"} onClick={() => toggleType("bus")} />
            <FilterChip label="Van" active={type === "van"} onClick={() => toggleType("van")} />
            {ROUTE_TYPE_OPTIONS.slice(0, 2).map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label.replace(/\s*\(.*\)/, "")}
                active={routeType === opt.value}
                onClick={() => toggleRouteType(opt.value)}
              />
            ))}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatus("");
                  setType("");
                  setAssignment("");
                  setDriverStatus("");
                  setDriverId("");
                  setMovement("");
                  setRouteType("");
                  setSearch("");
                }}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map controls — top right under search HUD; zoom stays center-right on map */}
      <div className="pointer-events-none absolute right-3 top-[7.5rem] z-20 flex flex-col gap-2 sm:right-4 sm:top-32">
        <div className="pointer-events-auto flex flex-col gap-2">
          <IconButton label="Fit All Units" onClick={() => setFitKey((k) => k + 1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>
          <IconButton label="Toggle Sweep" active={showSweep} onClick={() => setShowSweep((s) => !s)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 12V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>
          <IconButton label="More Filters" active={panel === "filters"} badge={activeFilterCount} onClick={() => setPanel((p) => (p === "filters" ? "none" : "filters"))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>
          <IconButton label="Fleet List" active={panel === "fleet" || panel === "detail"} badge={vehicles.length} onClick={() => setPanel((p) => (p === "fleet" || p === "detail" ? "none" : "fleet"))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>
      </div>

      {isError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4 lg:bottom-6">
          <div className="pointer-events-auto rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            Could not load fleet data.{" "}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {!isError && !initialLoading && vehicles.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4 lg:bottom-6">
          <div className="pointer-events-auto rounded-2xl bg-white/95 px-5 py-4 text-center ring-1 ring-black/5">
            <p className="text-sm font-semibold text-slate-800">No units on map</p>
            <p className="mt-1 text-xs text-slate-500">Adjust filters or check your fleet records.</p>
          </div>
        </div>
      )}

      {initialLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <div className="rounded-2xl bg-white px-6 py-4 ring-1 ring-black/5">
            <Spinner className="mx-auto h-8 w-8" />
            <p className="mt-3 text-sm text-slate-600">Loading fleet…</p>
          </div>
        </div>
      )}

      {/* Filters — bottom sheet on mobile, left drawer on lg+ */}
      <div
        className={cn(
          "absolute z-50 flex min-h-0 flex-col overflow-hidden bg-white transition-transform duration-300",
          "inset-x-0 bottom-0 max-h-[min(85vh,100dvh)] rounded-t-2xl ring-1 ring-black/5",
          "sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:w-[min(100%,20rem)] sm:max-h-none sm:rounded-none sm:ring-0 sm:shadow-2xl",
          panel === "filters"
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:-translate-x-full sm:translate-y-0",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold text-slate-900">Filters</h2>
          <button type="button" onClick={() => setPanel("none")} className="rounded-full p-2 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <SearchableSelect value={status} onChange={setStatus} options={VEHICLE_STATUS_OPTIONS} allLabel="All statuses" />
          <SearchableSelect value={type} onChange={setType} options={TYPE_OPTIONS} allLabel="All types" />
          <SearchableSelect value={routeType} onChange={setRouteType} options={ROUTE_TYPE_OPTIONS} allLabel="All route types" />
          <SearchableSelect value={assignment} onChange={(v) => setAssignment(v as typeof assignment)} options={ASSIGNMENT_OPTIONS} allLabel="All" />
          <SearchableSelect value={driverStatus} onChange={setDriverStatus} options={DRIVER_STATUS_OPTIONS} allLabel="Any driver" />
          <SearchableSelect value={driverId} onChange={setDriverId} options={driverOptions} allLabel="All drivers" />
          <SearchableSelect value={movement} onChange={(v) => setMovement(v as typeof movement)} options={MOVEMENT_OPTIONS} allLabel="Any movement" />
        </div>
      </div>

      {/* Fleet / detail — bottom sheet on mobile, right drawer on sm+ */}
      <div
        className={cn(
          "absolute z-50 flex min-h-0 flex-col overflow-hidden bg-white transition-transform duration-300",
          "inset-x-0 bottom-0 max-h-[min(85vh,100dvh)] rounded-t-2xl ring-1 ring-black/5",
          "sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:w-[min(100%,22rem)] sm:max-h-none sm:rounded-none sm:ring-0 sm:shadow-2xl",
          panel === "fleet" || panel === "detail"
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-x-full sm:translate-y-0",
        )}
      >
        {(panel === "fleet" || panel === "detail") && (
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        )}
        {panel === "detail" && selected ? (
          <VehicleDetailContent
            vehicle={selected}
            onClose={() => {
              setPanel("none");
              setSelectedId(null);
              setFollowSelected(false);
            }}
          />
        ) : (
          <>
            <div className="shrink-0 border-b px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{vehicles.length} units</h2>
                <button type="button" onClick={() => setPanel("none")} className="rounded-full p-2 hover:bg-slate-100">
                  ✕
                </button>
              </div>
              <input
                className="fp-input mt-3"
                placeholder="Filter list…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {filteredList.map((v) => (
                <li key={v.id}>
                  <FleetRow vehicle={v} onClick={() => selectVehicle(v)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {panel !== "none" && (
        <button
          type="button"
          aria-label="Close panel"
          className="absolute inset-0 z-40 bg-slate-900/30 sm:bg-slate-900/20"
          onClick={() => setPanel("none")}
        />
      )}

      {dataUpdatedAt > 0 && panel === "none" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium tabular-nums text-slate-500 ring-1 ring-black/5">
            {liveTracking && isFetching ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            ) : null}
            {liveTracking ? "Live" : "Snapshot"} · {new Date(dataUpdatedAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
