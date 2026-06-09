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

const cardStyle = "!p-4 sm:!p-5 [&>div:first-child]:mb-3";

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
            <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{total}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
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
      <Card title="Fleet overview" subtitle="Total resources across your organization" className={cn(cardStyle, "h-full")}>
        <ChartEmpty />
      </Card>
    );
  }

  return (
    <Card title="Fleet overview" subtitle="Total resources across your organization" className={cn(cardStyle, "h-full min-w-0")}>
      <div className="h-52 w-full min-w-0 sm:h-60 lg:h-64">
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={colored} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
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
              domain={[0, Math.ceil(maxVal * 1.15)]}
            />
            <Tooltip
              content={<ChartTooltipContent label="Count" />}
              offset={12}
              cursor={{ fill: "rgba(148,163,184,0.12)", radius: 6 }}
              wrapperStyle={tooltipWrapperStyle}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false}>
              {colored.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function DonutChart({
  data,
  title,
  subtitle,
  colorOffset = 0,
  compact = false,
  size: _size,
  layout: _layout,
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

  if (!colored.length || total === 0) {
    return (
      <Card title="Routes by type" subtitle="Morning, afternoon, and special services" className={cn(cardStyle, "h-full")}>
        <ChartEmpty message="No routes yet" />
      </Card>
    );
  }

  return (
    <Card
      title="Routes by type"
      subtitle="Morning, afternoon, and special services"
      className={cn(cardStyle, "flex h-full min-w-0 flex-col")}
      action={
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          {activeTotal} active
        </span>
      }
    >
      <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[11rem] sm:max-w-[12rem]">
          {activeIndex != null && colored[activeIndex] && (
            <DonutHoverLabel
              name={colored[activeIndex].name}
              value={
                colored[activeIndex].active != null
                  ? `${colored[activeIndex].value} total · ${colored[activeIndex].active} active`
                  : colored[activeIndex].value
              }
              fill={colored[activeIndex].fill ?? brand.primary}
            />
          )}
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {activeIndex === null && (
              <div className="text-center leading-none">
                <p className="text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">{total}</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Routes</p>
              </div>
            )}
          </div>
        </div>

        <ul className="space-y-3">
          {colored.map((item, i) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const active = item.active ?? item.value;
            const activePct = item.value > 0 ? Math.round((active / item.value) * 100) : 0;
            const highlighted = activeIndex === null || activeIndex === i;

            return (
              <li
                key={item.name}
                className={cn(
                  "rounded-xl border border-slate-100 p-3 transition",
                  highlighted ? "bg-white shadow-sm" : "bg-slate-50/80 opacity-70",
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.fill }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                    {item.value}
                    <span className="ml-1 text-xs font-normal text-slate-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 4)}%`, background: item.fill }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-emerald-700">{active}</span> active
                  {item.value > active && (
                    <span> · {item.value - active} inactive</span>
                  )}
                  {item.value > 0 && (
                    <span className="text-slate-400"> · {activePct}% live</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
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
