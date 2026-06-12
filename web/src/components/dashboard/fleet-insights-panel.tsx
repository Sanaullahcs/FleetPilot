"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { type ChartPoint } from "@/components/dashboard/charts";
import { DismissButton } from "@/components/dashboard/dismissible-section";
import { chartColor } from "@/lib/brand";
import type { DashboardAnalytics } from "@/lib/types";
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

function InsightCardShell({
  accent,
  title,
  subtitle,
  children,
  className,
}: {
  accent: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[13.5rem] flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06]"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative mb-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function InsightDonut({
  data,
  title,
  subtitle,
  colorOffset,
  accent,
  hidden,
}: {
  data: ChartPoint[];
  title: string;
  subtitle: string;
  colorOffset: number;
  accent: string;
  hidden?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const colored = applyColors(data, colorOffset);
  const total = colored.reduce((s, d) => s + d.value, 0);
  const activeItem = active != null ? colored[active] : null;

  if (hidden) return null;

  return (
    <InsightCardShell accent={accent} title={title} subtitle={subtitle}>
      {!colored.length || total === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-400">
          No data for current filters
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative mx-auto h-28 w-28 shrink-0 md:mx-0">
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
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-1">
              {activeItem ? (
                <div className="max-w-full text-center leading-tight">
                  <p className="truncate text-[10px] font-medium text-slate-500">{activeItem.name}</p>
                  <p className="text-lg font-semibold tabular-nums text-slate-900">{activeItem.value}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl font-semibold tabular-nums text-slate-900">{total}</p>
                  <p className="text-[11px] text-slate-400">Total</p>
                </div>
              )}
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-2">
            {colored.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <li key={item.name}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.fill }} />
                      <span className="truncate" title={item.name}>
                        {item.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-slate-800">
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
    </InsightCardShell>
  );
}

function SchoolBySchoolInsight({ data, hidden }: { data: ChartPoint[]; hidden?: boolean }) {
  const colored = applyColors(data, 5);
  const total = colored.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...colored.map((d) => d.value), 1);
  const accent = chartColor(5);

  if (hidden) return null;

  return (
    <InsightCardShell accent={accent} title="Students by school" subtitle="Enrollment across campuses">
      {!colored.length || total === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-400">
          No data for current filters
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="text-xs text-slate-500">Total enrolled</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{total}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="text-xs text-slate-500">Campuses</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{colored.length}</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {colored.map((school) => {
              const pct = total > 0 ? Math.round((school.value / total) * 100) : 0;
              const barPct = Math.max(4, Math.round((school.value / maxVal) * 100));
              return (
                <li key={school.name}>
                  <div className="mb-1 flex items-start justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: school.fill }} />
                      <span className="truncate" title={school.name}>
                        {school.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-slate-800">
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
    </InsightCardShell>
  );
}

export function FleetInsightsPanel({
  analytics,
  onDismiss,
  showPeopleCharts = true,
}: {
  analytics: DashboardAnalytics;
  onDismiss?: () => void;
  showPeopleCharts?: boolean;
}) {
  const [focus, setFocus] = useState<ViewFocus>("all");

  const showFleetDonuts = focus === "all" || focus === "fleet";
  const showPeopleDonuts = showPeopleCharts && (focus === "all" || focus === "people");

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
      {onDismiss && (
        <DismissButton
          onClick={onDismiss}
          label="Hide composition breakdown"
          className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4"
        />
      )}

      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 pr-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="fp-eyebrow">Fleet intelligence</p>
            <h2 className="fp-title-sm mt-0.5">Composition breakdown</h2>
            <p className="fp-subtitle mt-1 max-w-xl">
              Explore fleet and roster composition for the current filter selection.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200/80 bg-slate-50/80 p-1">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFocus(opt.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-left transition sm:min-w-[7.5rem]",
                  focus === opt.id
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <span className="block text-xs font-semibold">{opt.label}</span>
                <span className="block text-[11px] text-slate-400">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {(showFleetDonuts || showPeopleDonuts) && (
          <div
            className={cn(
              "grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2",
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
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            <InsightDonut
              data={analytics.student_status ?? []}
              title="Student status"
              subtitle="Enrollment state"
              colorOffset={4}
              accent={chartColor(4)}
            />
            <SchoolBySchoolInsight
              data={analytics.students_by_school ?? []}
            />
          </div>
        )}
      </div>
    </section>
  );
}
