"use client";

import { cn } from "@/lib/utils";

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function DismissButton({
  onClick,
  label = "Dismiss section",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition",
        "hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
        className,
      )}
    >
      <CloseIcon />
    </button>
  );
}

export function DismissibleSection({
  visible,
  onDismiss,
  dismissLabel,
  children,
  className,
}: {
  visible: boolean;
  onDismiss: () => void;
  dismissLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <div className={cn("relative", className)}>
      <DismissButton
        onClick={onDismiss}
        label={dismissLabel}
        className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4"
      />
      {children}
    </div>
  );
}
