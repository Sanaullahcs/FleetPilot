"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function parsePercent(value: React.ReactNode): number | null {
  if (typeof value !== "string" || !value.includes("%")) return null;
  const n = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}

export function DashboardStatTile({
  label,
  value,
  hint,
  accent,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent: string;
  icon: ReactNode;
  className?: string;
}) {
  const percent = parsePercent(value);

  return (
    <div
      className={cn(
        "group relative flex h-[4.625rem] items-center gap-2.5 overflow-hidden rounded-xl border border-slate-200/70 bg-white p-2.5 pl-3",
        "shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md",
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: accent }}
      />

      {percent !== null ? (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${percent}%`, background: accent }}
          />
        </div>
      ) : null}

      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
        style={{ background: accent }}
      >
        {icon}
      </div>

      <div className="relative min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums leading-tight text-slate-900">
          {value}
        </p>
        {hint ? (
          <p className="truncate text-[11px] leading-tight text-slate-400">{hint}</p>
        ) : null}
      </div>

      <div
        className="pointer-events-none absolute -right-1 -top-1 opacity-[0.05] [&_svg]:h-10 [&_svg]:w-10"
        style={{ color: accent }}
        aria-hidden
      >
        {icon}
      </div>
    </div>
  );
}

export function DashboardStatTileSkeleton({ accent }: { accent?: string }) {
  return (
    <div className="relative flex h-[4.625rem] items-center gap-2.5 overflow-hidden rounded-xl border border-slate-200/70 bg-white p-2.5 pl-3 shadow-sm">
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-40"
        style={{ background: accent ?? "#94a3b8" }}
      />
      <div className="h-8 w-8 shrink-0 animate-skeleton rounded-lg bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 bg-[length:200%_100%]" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-2.5 w-12 animate-skeleton rounded bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 bg-[length:200%_100%]" />
        <div className="h-4 w-8 animate-skeleton rounded bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 bg-[length:200%_100%]" />
        <div className="h-2 w-16 animate-skeleton rounded bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
