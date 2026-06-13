"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { PortalEmptyState } from "@/components/dashboard/portal-action-card";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { ScheduleIcon } from "@/components/dashboard/stat-icons";
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
  if (direction === "to_school") return "To School";
  if (direction === "from_school") return "From School";
  return direction ? titleCase(direction.replace(/_/g, " ")) : "—";
}

function ScheduleStateBadge({ state }: { state?: string | null }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset", scheduleStateClass(state))}>
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
        "relative flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-lg border px-1.5 py-1.5 transition",
        selected
          ? "border-brand-primary bg-brand-primary text-white"
          : day.is_today
            ? "border-brand-primary/40 bg-brand-primary/5 text-slate-800 hover:border-brand-primary/60"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{weekday}</span>
      <span className="text-base font-bold leading-tight">{dayNum}</span>
      {day.summary.total > 0 ? (
        <span
          className={cn(
            "mt-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            selected ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary",
          )}
        >
          {day.summary.total}
        </span>
      ) : (
        <span className="mt-1.5 h-4" />
      )}
    </button>
  );
}

function RunCard({ run, isToday }: { run: DriverPortalRun; isToday: boolean }) {
  const state = run.schedule_state ?? run.status;
  const school = run.route?.school?.name ?? "School not assigned";
  const routeCode = run.route?.code ?? "Route";

  return (
    <article className="fp-panel overflow-hidden">
      <div className="h-0.5 bg-brand-primary" />
      <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-brand-secondary">{run.run?.name ?? "Run assignment"}</h3>
              {isToday ? <Badge className="text-[10px]">Today</Badge> : null}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">{school}</p>
            <p className="text-[10px] text-slate-400">{run.service_date}</p>
          </div>
          <ScheduleStateBadge state={state} />
        </div>
      </div>

      <dl className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
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
      </dl>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 px-4 py-2 sm:border-l sm:border-t-0 sm:first:border-l-0 sm:px-5">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-slate-900">{value}</dd>
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
    <div className="space-y-5">
      <PageHeader compact eyebrow="Driver Portal" title="My Schedule" description={rangeLabel} />

      <PageState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        <div className="fp-panel p-3 sm:p-4">
          <div className="flex flex-wrap items-end gap-2.5 lg:flex-nowrap lg:gap-3">
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <div className="min-w-[7.5rem] flex-1 sm:w-36 sm:flex-none">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Range</p>
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
              <div className="min-w-[7.5rem] flex-1 sm:w-36 sm:flex-none">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
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

            {weekMode ? (
              <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto pb-0.5 lg:justify-center">
                {days.map((day) => (
                  <DayChip
                    key={day.date}
                    day={day}
                    selected={selectedDay?.date === day.date}
                    onSelect={() => setSelectedDate(day.date)}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <p className="text-[11px] text-slate-500">
                {visibleRuns.length} shown · {summary?.total ?? 0} total
              </p>
              <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {weekMode ? (
          <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-brand-secondary">
                  {selectedDay?.is_today ? "Today" : selectedDay?.label_long ?? selectedDay?.label ?? "Selected day"}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {visibleRuns.length
                    ? `${visibleRuns.length} run${visibleRuns.length === 1 ? "" : "s"} match your filters`
                    : "No runs match your filters for this day"}
                </p>
              </div>

              {visibleRuns.length ? (
                <div className="grid gap-2.5 xl:grid-cols-2">
                  {visibleRuns.map((run) => (
                    <RunCard key={run.assignment_id} run={run} isToday={selectedDay?.is_today ?? false} />
                  ))}
                </div>
              ) : (
                <EmptyPanel message="Try another day or change your status filter." />
              )}
            </section>
        ) : (
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-brand-secondary">Timeline</h2>
              <p className="text-[11px] text-slate-500">
                {visibleRuns.length} run{visibleRuns.length === 1 ? "" : "s"} in {rangeLabel}
              </p>
            </div>

            {days.some((day) => day.runs.length > 0) ? (
              days.map((day) =>
                day.runs.length ? (
                  <div key={day.date} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {day.label_long ?? day.label}
                      </h3>
                      {day.is_today ? <Badge className="text-[10px]">Today</Badge> : null}
                    </div>
                    <div className="grid gap-2.5 xl:grid-cols-2">
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
    <PortalEmptyState
      icon={<ScheduleIcon />}
      title="No Matching Runs"
      message={message}
    />
  );
}
