"use client";

import { cn } from "@/lib/utils";

export function LiveIndicator({
  active = true,
  label = "Live",
  className,
}: {
  active?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-slate-500", className)}>
      <span className="relative flex h-2 w-2 shrink-0">
        {active ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </>
        ) : (
          <span className="relative h-2 w-2 rounded-full bg-slate-300" />
        )}
      </span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
