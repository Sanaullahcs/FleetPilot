"use client";

import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { DashboardStatTileSkeleton } from "@/components/dashboard/dashboard-stat-tile";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "animate-skeleton rounded-lg bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 bg-[length:200%_100%]",
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}

export function StatCardSkeleton({ accent = brand.primary }: { accent?: string }) {
  return (
    <div className="fp-card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-1 opacity-40" style={{ background: accent }} />
      <div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-30"
        style={{ background: `${accent}20` }}
      />
      <div className="relative space-y-3">
        <Skeleton className="h-3 w-[4.5rem]" />
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function ChartCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className={cn("fp-card p-6", tall ? "min-h-[240px]" : "min-h-[220px]")}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <div className="mt-6 flex items-end justify-center gap-3">
        {[40, 65, 50, 80, 55, 70].map((h, i) => (
          <Skeleton key={i} className="w-8 rounded-t-md" style={{ height: `${h}%`, minHeight: h * 2 }} />
        ))}
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton({ count = 8 }: { count?: number }) {
  const accents = [brand.primary, brand.cyan, brand.accent, brand.orange, brand.primaryDark, brand.chart[5], brand.chart[6], brand.cyan];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardStatTileSkeleton key={i} accent={accents[i % accents.length]} />
      ))}
    </div>
  );
}

export function DashboardChartsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="fp-card p-4">
        <Skeleton className="h-4 w-28" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCardSkeleton tall />
        <ChartCardSkeleton tall />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <ChartCardSkeleton tall />
    </div>
  );
}
