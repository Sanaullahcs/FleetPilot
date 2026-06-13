"use client";

import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  className,
  compact,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section className={cn(compact ? "space-y-3" : "space-y-4", className)}>
      <div className={cn("flex items-center gap-2.5 border-b border-slate-100 pb-2.5")}>
        <div className="h-4 w-0.5 rounded-full bg-brand-primary" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-brand-secondary">{title}</h3>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  compact,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function ProfileFormPanel({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("fp-panel overflow-hidden", className)}>
      <div className="h-0.5 bg-brand-primary" />
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-brand-secondary">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
      {footer ? <div className="border-t border-slate-100 px-4 py-3 sm:px-5">{footer}</div> : null}
    </div>
  );
}

/** Standard text inputs on profile forms — matches admin forms. */
export const profileInputClass = "fp-input w-full";

export const profileSubmitClass =
  "rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60";

export const profileResetClass =
  "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60";
