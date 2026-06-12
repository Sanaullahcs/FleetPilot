"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brand, chartColor } from "@/lib/brand";
import { Card } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { PERIOD_OPTIONS, ROUTE_TYPE_OPTIONS } from "@/components/dashboard/dashboard-analytics-filters";
import type { DashboardFilters } from "@/lib/resources";
import { cn } from "@/lib/utils";

export interface ChartPoint {
  name: string;
  value: number;
  fill?: string;
  active?: number;
}

export interface RadarPoint {
  subject: string;
  score: number;
  fullMark?: number;
}

const tooltipWrapperStyle = { outline: "none", zIndex: 20, pointerEvents: "none" as const };

type TooltipPayloadItem = {
  name?: string;
  value?: number;
  color?: string;
  payload?: ChartPoint;
};

export function DonutHoverLabel({
  name,
  value,
  fill,
  className,
}: {
  name: string;
  value: React.ReactNode;
  fill: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md",
        className,
      )}
    >
      <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: fill }} />
      <span className="font-semibold text-slate-800">{name}</span>
      <span className="ml-1.5 tabular-nums text-slate-600">{value}</span>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatValue?: (value: number) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = String(item.name ?? label ?? "");
  const value = Number(item.value ?? 0);
  const fill = item.color ?? brand.primary;
  const display = formatValue ? formatValue(value) : value;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md">
      {name && <span className="font-semibold text-slate-800">{name}: </span>}
      <span className="tabular-nums text-slate-600" style={{ color: fill }}>{display}</span>
    </div>
  );
}

const cardStyle = "!p-0 !shadow-none !border-0 bg-transparent";

function DashboardChartCard({
  title,
  subtitle,
  accent,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[14rem] flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm sm:min-h-[15rem] sm:p-4",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.05]"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative mb-2.5 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function StatusBadge({ children, tone = "emerald" }: { children: React.ReactNode; tone?: "emerald" | "cyan" }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-brand-accent-light text-brand-accent-dark",
      )}
    >
      {children}
    </span>
  );
}

export function ChartCardFilters({
  filters,
  onChange,
  schoolOptions,
  showRouteType = false,
}: {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  schoolOptions: { label: string; value: string }[];
  showRouteType?: boolean;
}) {
  const isCustom = filters.period === "custom";

  return (
    <div className="space-y-2">
      <div className={cn("grid grid-cols-1 gap-2", showRouteType ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <div className="min-w-0">
          <label className="fp-label mb-1 block">Period</label>
          <SearchableSelect
            value={filters.period ?? "all"}
            onChange={(v) => onChange({ period: v as DashboardFilters["period"] })}
            options={PERIOD_OPTIONS}
            showAllOption={false}
            placeholder="All time"
          />
        </div>
        <div className="min-w-0">
          <label className="fp-label mb-1 block">School</label>
          <SearchableSelect
            value={filters.school_id ?? ""}
            onChange={(v) => onChange({ school_id: v || undefined })}
            options={schoolOptions}
            allLabel="All schools"
          />
        </div>
        {showRouteType && (
          <div className="min-w-0 sm:col-span-1">
            <label className="fp-label mb-1 block">Route type</label>
            <SearchableSelect
              value={filters.route_type ?? ""}
              onChange={(v) => onChange({ route_type: v || undefined })}
              options={ROUTE_TYPE_OPTIONS}
              allLabel="All types"
            />
          </div>
        )}
      </div>
      {isCustom && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="fp-label mb-1 block">From</label>
            <input
              type="date"
              className="fp-input"
              value={filters.from ?? ""}
              onChange={(e) => onChange({ from: e.target.value })}
            />
          </div>
          <div>
            <label className="fp-label mb-1 block">To</label>
            <input
              type="date"
              className="fp-input"
              value={filters.to ?? ""}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}


function applyColors(data: ChartPoint[], offset = 0): ChartPoint[] {
  return data.filter((d) => d.value > 0).map((d, i) => ({ ...d, fill: d.fill ?? chartColor(i + offset) }));
}

function shortLabel(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function ChartEmpty({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="flex min-h-[10rem] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

function DonutRing({
  data,
  total,
  className,
}: {
  data: ChartPoint[];
  total: number;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const bgSlice = { name: "_track", value: 1, fill: "#f1f5f9" };
  const activeItem = activeIndex != null ? data[activeIndex] : null;

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[9rem] sm:max-w-[10rem]", className)}>
      {activeItem && (
        <DonutHoverLabel name={activeItem.name} value={activeItem.value} fill={activeItem.fill ?? brand.primary} />
      )}
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <PieChart>
          <Pie
            data={[bgSlice]}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="88%"
            strokeWidth={0}
            isAnimationActive={false}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={data.length > 1 ? 2 : 0}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {activeIndex === null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center leading-none">
            <p className="text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">{total}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Total</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutLegend({
  items,
  compact = false,
}: {
  items: { name: string; value: number; fill: string }[];
  compact?: boolean;
}) {
  return (
    <ul className={cn("grid w-full gap-x-3 gap-y-1.5", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.fill }} />
            <span className="truncate" title={item.name}>
              {shortLabel(item.name, compact ? 18 : 24)}
            </span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-slate-800">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function FleetRadarChart({
  data,
  title = "Operations health",
  subtitle = "Active coverage across fleet resources (0–100%)",
}: {
  data: RadarPoint[];
  title?: string;
  subtitle?: string;
}) {
  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;

  if (!data.length) return <Card title={title} subtitle={subtitle} className={cardStyle}><ChartEmpty /></Card>;

  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={cardStyle}
      action={
        <span className="rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-xs font-bold text-brand-cyan">
          {avg}% overall
        </span>
      }
    >
      <div className="h-56 w-full min-w-0 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} />
            <Tooltip
              content={<ChartTooltipContent formatValue={(v) => `${v}%`} label="Score" />}
              offset={12}
              wrapperStyle={tooltipWrapperStyle}
            />
            <Radar
              name="Operations"
              dataKey="score"
              stroke={brand.primary}
              fill={brand.cyan}
              fillOpacity={0.35}
              strokeWidth={2}
              dot={{ r: 3, fill: brand.orange, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Radar
              name="Target"
              dataKey="fullMark"
              stroke={brand.orange}
              fill="transparent"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function FleetBarChart({ data }: { data: ChartPoint[] }) {
  const colored = applyColors(data);
  const maxVal = Math.max(...colored.map((d) => d.value), 1);

  if (!colored.length) {
    return (
      <DashboardChartCard
        title="Fleet overview"
        subtitle="Total resources across your organization"
        accent={brand.primary}
        className="h-full"
      >
        <ChartEmpty />
      </DashboardChartCard>
    );
  }

  return (
    <DashboardChartCard
      title="Fleet overview"
      subtitle="Total resources across your organization"
      accent={brand.primary}
      className="h-full min-w-0"
    >
      <div className="h-full min-h-[10rem] w-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={colored} margin={{ top: 4, right: 4, left: 0, bottom: 2 }} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={(v) => shortLabel(String(v), 10)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={28}
              domain={[0, Math.ceil(maxVal * 1.12)]}
            />
            <Tooltip
              content={<ChartTooltipContent label="Count" />}
              offset={12}
              cursor={{ fill: "rgba(148,163,184,0.12)", radius: 6 }}
              wrapperStyle={tooltipWrapperStyle}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive={false}>
              {colored.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartCard>
  );
}

export function DonutChart({
  data,
  title,
  subtitle,
  colorOffset = 0,
  compact = false,
}: {
  data: ChartPoint[];
  title: string;
  subtitle?: string;
  colorOffset?: number;
  compact?: boolean;
  size?: string;
  layout?: string;
}) {
  const colored = applyColors(data, colorOffset);
  const total = colored.reduce((s, d) => s + d.value, 0);
  const legendItems = colored.map((d) => ({ name: d.name, value: d.value, fill: d.fill! }));

  return (
    <Card title={title} subtitle={subtitle} className={cn(cardStyle, "flex h-full min-w-0 flex-col")}>
      {!colored.length || total === 0 ? (
        <ChartEmpty />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 py-1">
          <DonutRing data={colored} total={total} className={compact ? "max-w-[7.5rem]" : undefined} />
          <DonutLegend items={legendItems} compact={compact} />
        </div>
      )}
    </Card>
  );
}

export function RoutesByTypeChart({ data }: { data: ChartPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const colored = applyColors(data, 0);
  const total = colored.reduce((s, d) => s + d.value, 0);
  const activeTotal = colored.reduce((s, d) => s + (d.active ?? d.value), 0);
  const activeItem = activeIndex != null ? colored[activeIndex] : null;

  if (!colored.length || total === 0) {
    return (
      <DashboardChartCard
        title="Routes by type"
        subtitle="Morning, afternoon, and special services"
        accent={brand.accent}
        className="h-full"
      >
        <ChartEmpty message="No routes yet" />
      </DashboardChartCard>
    );
  }

  return (
    <DashboardChartCard
      title="Routes by type"
      subtitle="Morning, afternoon, and special services"
      accent={brand.accent}
      className="flex h-full min-w-0 flex-col"
      action={<StatusBadge>{activeTotal} active</StatusBadge>}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 md:flex-row md:items-stretch md:gap-5">
        <div className="flex min-h-[9.5rem] flex-1 items-center justify-center md:min-h-0 md:max-w-[46%]">
          <div className="relative aspect-square h-full w-full max-h-full max-w-[11.5rem] md:max-w-none">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie
                data={[{ value: 1, fill: "#f1f5f9" }]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="56%"
                outerRadius="90%"
                strokeWidth={0}
                isAnimationActive={false}
              />
              <Pie
                data={colored}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="56%"
                outerRadius="90%"
                paddingAngle={colored.length > 1 ? 3 : 0}
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {colored.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
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
                {activeItem.active != null && (
                  <p className="text-[10px] text-emerald-600">{activeItem.active} active</p>
                )}
              </div>
            ) : (
              <div className="text-center leading-none">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">{total}</p>
                <p className="mt-1 text-xs text-slate-400">Routes</p>
              </div>
            )}
          </div>
          </div>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 md:gap-3">
          {colored.map((item, i) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const active = item.active ?? item.value;
            const activePct = item.value > 0 ? Math.round((active / item.value) * 100) : 0;
            const highlighted = activeIndex === null || activeIndex === i;

            return (
              <li
                key={item.name}
                className={cn("rounded-lg px-1 py-1 transition", !highlighted && "opacity-60")}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.fill }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                    {item.value}
                    <span className="ml-1 font-normal text-slate-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 6)}%`, background: item.fill }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-700">{active}</span> active
                  {item.value > 0 && <span className="text-slate-400"> · {activePct}% live</span>}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardChartCard>
  );
}

export function SchoolStudentsChart({ data }: { data: ChartPoint[] }) {
  const colored = applyColors(data);
  const total = colored.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...colored.map((d) => d.value), 1);

  if (!colored.length) {
    return (
      <Card title="Students by school" subtitle="Enrollment across campuses" className={cardStyle}>
        <ChartEmpty />
      </Card>
    );
  }

  return (
    <Card title="Students by school" subtitle="Enrollment across campuses" className={cn(cardStyle, "min-w-0")}>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total enrolled</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-brand-secondary sm:text-3xl">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Campuses</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-700 sm:text-3xl">{colored.length}</p>
        </div>
      </div>

      <ul className="space-y-4">
        {colored.map((school) => {
          const pct = total > 0 ? Math.round((school.value / total) * 100) : 0;
          const barPct = Math.max(4, Math.round((school.value / maxVal) * 100));
          return (
            <li key={school.name} className="min-w-0">
              <div className="mb-1.5 flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 font-medium leading-snug text-slate-700" title={school.name}>
                  {school.name}
                </span>
                <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-500">
                  <span className="font-semibold text-slate-800">{school.value}</span>
                  <span className="ml-1 text-slate-400">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: school.fill }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
