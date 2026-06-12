"use client";

import { ChartCardFilters } from "@/components/dashboard/charts";
import { Spinner } from "@/components/ui/primitives";
import type { DashboardFilters } from "@/lib/resources";
import { cn } from "@/lib/utils";

export function DashboardAnalyticsFilterBar({
  filters,
  onChange,
  onClear,
  schoolOptions,
  isRefreshing,
  hasActive,
}: {
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onClear: () => void;
  schoolOptions: { label: string; value: string }[];
  isRefreshing?: boolean;
  hasActive?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-cyan" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="fp-title-sm">Analytics filters</h3>
          <p className="fp-subtitle mt-0.5">Refine overview metrics and charts in real time</p>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Spinner className="h-3.5 w-3.5" />
              Updating…
            </span>
          ) : null}
          {hasActive ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      </div>
      <ChartCardFilters
        filters={filters}
        onChange={onChange}
        schoolOptions={schoolOptions}
        showRouteType
      />
    </div>
  );
}

export function DashboardRefreshingSection({
  refreshing,
  children,
  className,
}: {
  refreshing?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        refreshing && "opacity-75",
        className,
      )}
    >
      {children}
    </div>
  );
}
