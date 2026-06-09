"use client";

import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/primitives";
import { ActiveFilterPills } from "@/components/ui/filter-bar";
import type { DashboardFilters } from "@/lib/resources";

export const PERIOD_OPTIONS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Year to date", value: "ytd" },
  { label: "All time", value: "all" },
  { label: "Custom range", value: "custom" },
];

export const ROUTE_TYPE_OPTIONS = [
  { label: "Morning (AM)", value: "am" },
  { label: "Afternoon (PM)", value: "pm" },
  { label: "Midday", value: "midday" },
  { label: "Activity", value: "activity" },
  { label: "Special education", value: "sped" },
  { label: "Charter", value: "charter" },
];

interface DashboardAnalyticsFiltersProps {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onClear: () => void;
  schoolOptions: { label: string; value: string }[];
}

export function DashboardAnalyticsFilters({
  filters,
  onChange,
  onClear,
  schoolOptions,
}: DashboardAnalyticsFiltersProps) {
  const isCustom = filters.period === "custom";
  const hasActive =
    filters.period !== "all" ||
    Boolean(filters.school_id) ||
    Boolean(filters.route_type) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  const pills = [
    ...(filters.period !== "all"
      ? [{ key: "period", label: `Period: ${PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label ?? filters.period}` }]
      : []),
    ...(filters.school_id
      ? [{ key: "school_id", label: `School: ${schoolOptions.find((s) => s.value === filters.school_id)?.label ?? "Selected"}` }]
      : []),
    ...(filters.route_type
      ? [{ key: "route_type", label: `Route: ${ROUTE_TYPE_OPTIONS.find((r) => r.value === filters.route_type)?.label ?? filters.route_type}` }]
      : []),
    ...(isCustom && filters.from ? [{ key: "from", label: `From: ${filters.from}` }] : []),
    ...(isCustom && filters.to ? [{ key: "to", label: `To: ${filters.to}` }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="fp-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-brand-secondary">Analytics filters</h3>
            <p className="text-xs text-slate-500">Refine charts by date range, school, or route type</p>
          </div>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Reset filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date range
            </label>
            <SearchableSelect
              value={filters.period ?? "all"}
              onChange={(v) => onChange({ period: v as DashboardFilters["period"] })}
              options={PERIOD_OPTIONS}
              showAllOption={false}
              placeholder="Select period"
              searchPlaceholder="Search periods…"
            />
          </div>

          {isCustom && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  className="fp-input"
                  value={filters.from ?? ""}
                  onChange={(e) => onChange({ from: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  To
                </label>
                <input
                  type="date"
                  className="fp-input"
                  value={filters.to ?? ""}
                  onChange={(e) => onChange({ to: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              School
            </label>
            <SearchableSelect
              value={filters.school_id ?? ""}
              onChange={(v) => onChange({ school_id: v || undefined })}
              options={schoolOptions}
              allLabel="All schools"
              placeholder="All schools"
              searchPlaceholder="Search schools…"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Route type
            </label>
            <SearchableSelect
              value={filters.route_type ?? ""}
              onChange={(v) => onChange({ route_type: v || undefined })}
              options={ROUTE_TYPE_OPTIONS}
              allLabel="All types"
              placeholder="All types"
              searchPlaceholder="Search types…"
            />
          </div>
        </div>
      </div>

      <ActiveFilterPills
        items={pills}
        onRemove={(key) => {
          if (key === "period") onChange({ period: "all", from: undefined, to: undefined });
          if (key === "school_id") onChange({ school_id: undefined });
          if (key === "route_type") onChange({ route_type: undefined });
          if (key === "from") onChange({ from: undefined });
          if (key === "to") onChange({ to: undefined });
        }}
      />
    </div>
  );
}
