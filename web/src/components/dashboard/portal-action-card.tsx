"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PortalActionCard({
  href,
  title,
  description,
  accent,
  icon,
  className,
}: {
  href: string;
  title: string;
  description: string;
  accent: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[4.5rem] items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-primary">{title}</p>
        <p className="truncate text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export function PortalSectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("fp-panel overflow-hidden", className)}>
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-brand-secondary">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PortalAvatar({
  name,
  accent,
}: {
  name: string;
  accent?: string;
}) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) ?? "?").toUpperCase();

  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
      style={{ background: accent ?? brandFallback }}
    >
      {initials}
    </span>
  );
}

const brandFallback = "#4F5BA9";

export function PortalStatTile({
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
  return (
    <div
      className={cn(
        "relative flex h-[4.25rem] items-center gap-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 pl-3",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-3 [&_svg]:w-3"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
        <p className="truncate text-base font-semibold tabular-nums leading-tight text-slate-900">{value}</p>
        {hint ? <p className="truncate text-[10px] leading-tight text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function PortalEmptyState({
  title,
  message,
  icon,
  className,
}: {
  title?: string;
  message: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("fp-panel flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      {icon ? (
        <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
      ) : null}
      {title ? <p className="text-sm font-semibold text-brand-secondary">{title}</p> : null}
      <p className={cn("max-w-md text-xs leading-relaxed text-slate-500", title && "mt-1")}>{message}</p>
    </div>
  );
}
