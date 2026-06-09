"use client";

import { StatusBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function StatusChip({
  status,
  onClick,
  disabled,
}: {
  status: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        "rounded-full transition",
        interactive && "cursor-pointer hover:ring-2 hover:ring-brand-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
      title={interactive ? "Click to change status" : undefined}
    >
      <StatusBadge status={status} />
    </button>
  );
}
