"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/primitives";
import { ActiveFilterPills } from "@/components/ui/filter-bar";
import { DismissButton } from "@/components/dashboard/dismissible-section";
import { PERIOD_OPTIONS } from "@/components/dashboard/dashboard-analytics-filters";
import { DonutHoverLabel, type ChartPoint } from "@/components/dashboard/charts";
import { chartColor } from "@/lib/brand";
import type { DashboardAnalytics } from "@/lib/types";
import type { DashboardFilters } from "@/lib/resources";
import { cn } from "@/lib/utils";

type ViewFocus = "all" | "fleet" | "people";

const FOCUS_OPTIONS: { id: ViewFocus; label: string; hint: string }[] = [
  { id: "all", label: "All metrics", hint: "Full picture" },
  { id: "fleet", label: "Fleet", hint: "Vehicles & service" },
  { id: "people", label: "People", hint: "Drivers & students" },
];

function applyColors(data: ChartPoint[], offset = 0): ChartPoint[] {
  return data.filter((d) => d.value > 0).map((d, i) => ({ ...d, fill: d.fill ?? chartColor(i + offset) }));
}

function InsightDonut({
  data,
  title,
  subtitle,
  colorOffset,
  accent,
  compact,
  hidden,
}: {
  data: ChartPoint[];
  title: string;
  subtitle: string;
  colorOffset: number;
  accent: string;
  compact?: boolean;
  hidden?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const colored = applyColors(data, colorOffset);
  const total = colored.reduce((s, d) => s + d.value, 0);

  if (hidden) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className={cn("mb-3", compact && "mb-2")}>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {!colored.length || total === 0 ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400",
            compact ? "min-h-[7rem]" : "min-h-[9rem]",
          )}
        >
          No data for current filters
        </div>
      ) : (
        <div className={cn(compact && "flex items-center gap-3")}>
          <div
            className={cn(
              "relative mx-auto aspect-square w-full",
              compact ? "max-w-[6.5rem] shrink-0" : "max-w-[8.5rem] sm:max-w-[9.5rem]",
            )}
          >
            {active != null && colored[active] && (
              <DonutHoverLabel
                name={colored[active].name}
                value={colored[active].value}
                fill={colored[active].fill ?? accent}
              />
            )}
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie
                  data={[{ value: 1, fill: "#f1f5f9" }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="88%"
                  strokeWidth={0}
                  isAnimationActive={false}
                />
                <Pie
                  data={colored}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={colored.length > 1 ? 3 : 0}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                  onMouseEnter={(_, i) => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                >
                  {colored.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                      opacity={active === null || active === i ? 1 : 0.35}
                      style={{ transition: "opacity 0.2s" }}
                    />
                  ))}
                </Pie>
            </PieChart>
          </ResponsiveContainer>
            {active === null && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className={cn("font-bold tabular-nums text-slate-900", compact ? "text-xl" : "text-2xl")}>{total}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                </div>
              </div>
            )}
          </div>

          <ul className={cn("space-y-2", compact ? "min-w-0 flex-1" : "mt-3")}>
            {colored.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <li key={item.name}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.fill }} />
                      <span className="truncate" title={item.name}>{item.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                      {item.value}
                      <span className="ml-1 font-normal text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%`, background: item.fill }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SchoolBySchoolInsight({ data, hidden }: { data: ChartPoint[]; hidden?: boolean }) {
  const colored = applyColors(data, 5);
  const total = colored.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...colored.map((d) => d.value), 1);

  if (hidden) return null;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md p-4 sm:p-5"
      style={{ borderLeftWidth: 3, borderLeftColor: chartColor(5) }}
    >
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-900">Students by school</p>
        <p className="text-xs text-slate-500">Enrollment across campuses</p>
      </div>

      {!colored.length || total === 0 ? (
        <div className="flex min-h-[9rem] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          No data for current filters
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total enrolled</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-brand-secondary">{total}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Campuses</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-700">{colored.length}</p>
            </div>
          </div>
          <ul className="space-y-3">
            {colored.map((school) => {
              const pct = total > 0 ? Math.round((school.value / total) * 100) : 0;
              const barPct = Math.max(4, Math.round((school.value / maxVal) * 100));
              return (
                <li key={school.name}>
                  <div className="mb-1 flex items-start justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: school.fill }} />
                      <span className="truncate" title={school.name}>{school.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                      {school.value}
                      <span className="ml-1 font-normal text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%`, background: school.fill }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function FleetInsightsPanel({
  analytics,
  filters,
  onChange,
  onClear,
  onDismiss,
  schoolOptions,
  showPeopleCharts = true,
}: {
  analytics: DashboardAnalytics;
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onClear: () => void;
  onDismiss?: () => void;
  schoolOptions: { label: string; value: string }[];
  showPeopleCharts?: boolean;
}) {
  const [focus, setFocus] = useState<ViewFocus>("all");

  const isCustom = filters.period === "custom";
  const hasActive =
    filters.period !== "all" ||
    Boolean(filters.school_id) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  const pills = useMemo(
    () => [
      ...(filters.period !== "all"
        ? [{ key: "period", label: `Period: ${PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label ?? filters.period}` }]
        : []),
      ...(filters.school_id
        ? [{ key: "school_id", label: `School: ${schoolOptions.find((s) => s.value === filters.school_id)?.label ?? "Selected"}` }]
        : []),
      ...(isCustom && filters.from ? [{ key: "from", label: `From: ${filters.from}` }] : []),
      ...(isCustom && filters.to ? [{ key: "to", label: `To: ${filters.to}` }] : []),
    ],
    [filters, schoolOptions, isCustom],
  );

  const showFleetDonuts = focus === "all" || focus === "fleet";
  const showPeopleDonuts = showPeopleCharts && (focus === "all" || focus === "people");

  return (
    <section className="relative fp-card overflow-hidden">
      {onDismiss && (
        <DismissButton
          onClick={onDismiss}
          label="Hide composition breakdown"
          className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4"
        />
      )}
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 pr-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">Fleet intelligence</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">Composition breakdown</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Filter by period or school — then explore fleet and roster composition.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {hasActive && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Reset filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 sm:gap-3">
          {FOCUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFocus(opt.id)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition sm:px-4",
                focus === opt.id
                  ? "border-brand-primary/30 bg-brand-primary text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-primary/20",
              )}
            >
              <span className="block text-xs font-bold">{opt.label}</span>
              <span className={cn("block text-[10px]", focus === opt.id ? "text-white/80" : "text-slate-400")}>
                {opt.hint}
              </span>
            </button>
          ))}

          <div className="flex w-full flex-wrap items-end gap-2 sm:ml-auto sm:w-auto">
            <div className="min-w-[8.5rem] flex-1 sm:flex-none sm:w-36">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Period</label>
              <SearchableSelect
                value={filters.period ?? "all"}
                onChange={(v) => onChange({ period: v as DashboardFilters["period"] })}
                options={PERIOD_OPTIONS}
                showAllOption={false}
                placeholder="All time"
              />
            </div>
            <div className="min-w-[8.5rem] flex-1 sm:flex-none sm:w-40">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">School</label>
              <SearchableSelect
                value={filters.school_id ?? ""}
                onChange={(v) => onChange({ school_id: v || undefined })}
                options={schoolOptions}
                allLabel="All schools"
              />
            </div>
          </div>
        </div>

        {isCustom && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-md">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">From</label>
              <input type="date" className="fp-input" value={filters.from ?? ""} onChange={(e) => onChange({ from: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">To</label>
              <input type="date" className="fp-input" value={filters.to ?? ""} onChange={(e) => onChange({ to: e.target.value })} />
            </div>
          </div>
        )}

        {pills.length > 0 && (
          <div className="mt-3">
            <ActiveFilterPills
              items={pills}
              onRemove={(key) => {
                if (key === "period") onChange({ period: "all", from: undefined, to: undefined });
                if (key === "school_id") onChange({ school_id: undefined });
                if (key === "from") onChange({ from: undefined });
                if (key === "to") onChange({ to: undefined });
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {(showFleetDonuts || showPeopleDonuts) && (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2",
              focus === "all" && showFleetDonuts && showPeopleDonuts && "lg:grid-cols-3",
              focus === "fleet" && "lg:grid-cols-2",
              focus === "people" && "lg:grid-cols-1 lg:max-w-md",
            )}
          >
            {showFleetDonuts && (
              <>
                <InsightDonut
                  data={analytics.vehicles_by_type ?? []}
                  title="Vehicles by type"
                  subtitle="Fleet mix"
                  colorOffset={2}
                  accent={chartColor(2)}
                />
                <InsightDonut
                  data={analytics.vehicle_status}
                  title="Vehicle status"
                  subtitle="Service state"
                  colorOffset={1}
                  accent={chartColor(1)}
                />
              </>
            )}
            {showPeopleDonuts && (
              <InsightDonut
                data={analytics.driver_status ?? []}
                title="Driver status"
                subtitle="Roster state"
                colorOffset={3}
                accent={chartColor(3)}
              />
            )}
          </div>
        )}

        {showPeopleDonuts && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InsightDonut
              data={analytics.student_status ?? []}
              title="Student status"
              subtitle="Enrollment state"
              colorOffset={4}
              accent={chartColor(4)}
            />
            <SchoolBySchoolInsight data={analytics.students_by_school ?? []} />
          </div>
        )}
      </div>
    </section>
  );
}
