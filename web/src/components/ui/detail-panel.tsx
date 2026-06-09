"use client";

import { cn } from "@/lib/utils";

export function DetailStats({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
  );
}

export function DetailStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        accent
          ? "border-brand-accent/30 bg-brand-accent-light/60"
          : "border-slate-200 bg-slate-50/80",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 text-xl font-bold tabular-nums", accent ? "text-brand-accent-dark" : "text-slate-900")}>
        {value}
      </p>
    </div>
  );
}

export function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <span className="h-4 w-1 rounded-full bg-brand-accent" aria-hidden />
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

export function DetailItem({
  label,
  value,
  href,
  className,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  className?: string;
  mono?: boolean;
}) {
  const display = value ?? "—";
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={cn("mt-1 text-sm font-medium text-slate-900", mono && "font-mono text-xs")}>
        {href && display !== "—" ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}

export function DetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-accent" />
      <p className="mt-3 text-sm text-slate-500">Loading details…</p>
    </div>
  );
}

export function DetailError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function formatAddress(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ") || "—";
}

export function formatBellTimes(bell: Record<string, string> | null | undefined) {
  if (!bell || !Object.keys(bell).length) return "—";
  return Object.entries(bell)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join(" · ");
}
