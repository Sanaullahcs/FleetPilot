"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function QuickActionTile({
  href,
  label,
  description,
  accent,
}: {
  href: string;
  label: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-[4.75rem] items-center gap-3 overflow-hidden rounded-xl border border-slate-200/70 bg-white p-3",
        "shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />

      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition group-hover:scale-105"
        style={{ background: accent }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8h10M9 5l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-primary">{label}</p>
        <p className="truncate text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export function CompactQuickActions({
  items,
  flat,
}: {
  items: { href: string; label: string; accent: string }[];
  flat?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quick</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50",
            !flat && "shadow-sm",
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.accent }} aria-hidden />
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function QuickActionsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-cyan" />
      <div className="relative mb-3">
        <h3 className="fp-title-sm">{title}</h3>
        <p className="fp-subtitle mt-0.5">{description}</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}
