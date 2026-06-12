"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { getDriverSchedule } from "@/lib/resources";
import {
  SCHEDULE_RANGE_OPTIONS,
  SCHEDULE_STATUS_FILTERS,
  countForFilter,
  formatScheduleRangeLabel,
  formatScheduleState,
  isWeekRange,
  scheduleStateClass,
  type DriverScheduleRange,
  type DriverScheduleState,
} from "@/lib/driver-schedule";
import { cn, titleCase } from "@/lib/utils";
import type { DriverPortalRun, DriverScheduleDay } from "@/lib/types";

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

function ScheduleStateBadge({ state }: { state?: string | null }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", scheduleStateClass(state))}>
      {formatScheduleState(state)}
    </span>
  );
}

function DayChip({
  day,
  selected,
  onSelect,
}: {
  day: DriverScheduleDay;
  selected: boolean;
  onSelect: () => void;
}) {
  const weekday = day.label.split(" ")[0] ?? day.weekday.slice(0, 3);
  const dayNum = day.label.split(" ")[1] ?? "";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex min-w-[4.5rem] flex-col items-center rounded-2xl border px-3 py-3 transition",
        selected
          ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
          : day.is_today
            ? "border-brand-primary/40 bg-brand-primary/5 text-slate-800 hover:border-brand-primary/60"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{weekday}</span>
      <span className="text-xl font-extrabold leading-tight">{dayNum}</span>
      {day.summary.total > 0 ? (
        <span
          className={cn(
            "mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold",
            selected ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary",
          )}
        >
          {day.summary.total}
        </span>
      ) : (
        <span className="mt-2 h-5" />
      )}
    </button>
  );
}

function RunCard({ run, isToday }: { run: DriverPortalRun; isToday: boolean }) {
  const state = run.schedule_state ?? run.status;
  const school = run.route?.school?.name ?? "School not assigned";
  const routeCode = run.route?.code ?? "Route";

  return (
    <article className="fp-card overflow-hidden transition hover:shadow-md">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-primary/5 to-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{run.run?.name ?? "Run assignment"}</h3>
              {isToday ? <Badge>Today</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">{school}</p>
            <p className="mt-1 text-xs text-slate-400">{run.service_date}</p>
          </div>
          <ScheduleStateBadge state={state} />
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <Fact label="Route" value={routeCode} />
        <Fact
          label="Window"
          value={`${formatTime(run.run?.scheduled_start_time)} – ${formatTime(run.run?.scheduled_end_time)}`}
        />
        <Fact label="Direction" value={directionLabel(run.run?.direction)} />
        <Fact
          label="Vehicle"
          value={
            run.vehicle
              ? `#${run.vehicle.vehicle_number} · ${formatVehicleType(run.vehicle.type)}`
              : "Not assigned"
          }
        />
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function MySchedulePage() {
  const [range, setRange] = useState<DriverScheduleRange>("this_week");
  const [statusFilter, setStatusFilter] = useState<DriverScheduleState>("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["driver-schedule", range, statusFilter],
    queryFn: () => getDriverSchedule({ range, status: statusFilter }),
  });

  const days = data?.days ?? [];
  const weekMode = isWeekRange(range);
  const summary = data?.summary;

  const selectedDay = useMemo(
    () =>
      weekMode
        ? days.find((day) => day.date === selectedDate) ??
          days.find((day) => day.is_today) ??
          days.find((day) => day.runs.length > 0) ??
          null
        : null,
    [days, selectedDate, weekMode],
  );

  const rangeLabel = data ? formatScheduleRangeLabel(data.range_start, data.range_end) : "Loading range…";
  const visibleRuns = weekMode ? selectedDay?.runs ?? [] : data?.runs ?? days.flatMap((day) => day.runs);

  const rangeOptions = SCHEDULE_RANGE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
    sublabel: option.hint,
    searchText: `${option.label} ${option.hint}`,
  }));

  const statusOptions = SCHEDULE_STATUS_FILTERS.map((filter) => ({
    value: filter.id,
    label: filter.label,
    meta: summary ? String(countForFilter(summary, filter.id)) : "0",
    searchText: filter.label,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="My schedule" description={rangeLabel} />

      <PageState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <div className="fp-card space-y-3 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Date range</p>
              <SearchableSelect
                value={range}
                onChange={(value) => {
                  const next = value as DriverScheduleRange;
                  setRange(next);
                  if (next === "this_week" || next === "today") {
                    setSelectedDate(new Date().toISOString().slice(0, 10));
                  }
                }}
                options={rangeOptions}
                placeholder="Select range"
                searchPlaceholder="Search ranges…"
                showAllOption={false}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</p>
              <SearchableSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as DriverScheduleState)}
                options={statusOptions}
                placeholder="All statuses"
                searchPlaceholder="Search statuses…"
                showAllOption={false}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-500">
              {visibleRuns.length} shown · {summary?.total ?? 0} total in range
            </p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
          </div>
        </div>

        {weekMode ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((day) => (
                <DayChip
                  key={day.date}
                  day={day}
                  selected={selectedDay?.date === day.date}
                  onSelect={() => setSelectedDate(day.date)}
                />
              ))}
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedDay?.is_today ? "Today" : selectedDay?.label_long ?? selectedDay?.label ?? "Selected day"}
                </h2>
                <p className="text-sm text-slate-500">
                  {visibleRuns.length
                    ? `${visibleRuns.length} run${visibleRuns.length === 1 ? "" : "s"} match your filters`
                    : "No runs match your filters for this day"}
                </p>
              </div>

              {visibleRuns.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleRuns.map((run) => (
                    <RunCard key={run.assignment_id} run={run} isToday={selectedDay?.is_today ?? false} />
                  ))}
                </div>
              ) : (
                <EmptyPanel message="Try another day or change your status filter." />
              )}
            </section>
          </>
        ) : (
          <section className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Timeline</h2>
              <p className="text-sm text-slate-500">
                {visibleRuns.length} run{visibleRuns.length === 1 ? "" : "s"} in {rangeLabel}
              </p>
            </div>

            {days.some((day) => day.runs.length > 0) ? (
              days.map((day) =>
                day.runs.length ? (
                  <div key={day.date} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        {day.label_long ?? day.label}
                      </h3>
                      {day.is_today ? <Badge>Today</Badge> : null}
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {day.runs.map((run) => (
                        <RunCard key={run.assignment_id} run={run} isToday={day.is_today} />
                      ))}
                    </div>
                  </div>
                ) : null,
              )
            ) : (
              <EmptyPanel message="Adjust your date range or status filter to see assignments." />
            )}
          </section>
        )}
      </PageState>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="fp-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📅</div>
      <h3 className="text-lg font-bold text-slate-900">No matching runs</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}
