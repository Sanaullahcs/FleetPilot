"use client";

import { cn, statusBadgeClass, titleCase } from "@/lib/utils";
import { brand } from "@/lib/brand";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-primary",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        statusBadgeClass(status),
      )}
    >
      {titleCase(status)}
    </span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-brand-primary text-white shadow-sm shadow-brand-primary/25 hover:bg-brand-dark",
    secondary: "border border-slate-200 bg-white text-brand-secondary shadow-sm hover:bg-brand-light",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-brand-light hover:text-brand-primary",
    dark: "bg-brand-secondary text-white hover:bg-zinc-800",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  compact,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{eyebrow}</p>}
        <h2 className={compact ? "text-xl font-semibold text-brand-secondary" : "fp-title"}>{title}</h2>
        {description && (
          <p className={compact ? "mt-1 text-xs text-slate-500" : "fp-subtitle mt-1.5"}>{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: string;
  accent?: string;
}) {
  return (
    <div className="fp-card group relative overflow-hidden p-5">
      {accent && (
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      )}
      <div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-60 transition group-hover:opacity-100"
        style={{ background: accent ? `${accent}15` : undefined }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="fp-label">{label}</p>
          <p className="fp-stat-value mt-1.5">{value}</p>
          {hint && <p className="fp-stat-hint mt-0.5">{hint}</p>}
          {trend && <p className="mt-2 text-xs font-medium text-emerald-600">{trend}</p>}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: accent ?? brand.primary }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="fp-panel flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon ? (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </div>
      ) : null}
      <p className="max-w-md text-xs leading-relaxed text-slate-500">{message}</p>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative sm:w-72">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="fp-input pl-10"
      />
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("fp-card p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-bold text-brand-secondary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
