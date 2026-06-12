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
        "group relative flex min-h-[7.25rem] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40",
        "transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 hover:shadow-md hover:shadow-brand-primary/10",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div
        className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full opacity-[0.07] blur-2xl"
        style={{ background: accent }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm [&_svg]:h-[18px] [&_svg]:w-[18px]"
          style={{ background: accent }}
        >
          {icon}
        </div>
        <span
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400 transition group-hover:border-brand-primary/20 group-hover:bg-brand-light/40 group-hover:text-brand-primary"
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className="relative mt-3 min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>

      <div
        className="pointer-events-none absolute bottom-2 right-2 opacity-[0.06] transition group-hover:opacity-[0.09] [&_svg]:h-14 [&_svg]:w-14"
        style={{ color: accent }}
        aria-hidden
      >
        {icon}
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
    <section className={cn("fp-card overflow-hidden", className)}>
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.07] via-brand-light/30 to-white px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
      style={{ background: accent ?? "var(--brand-primary, #4f5ba9)" }}
    >
      {initials}
    </span>
  );
}
