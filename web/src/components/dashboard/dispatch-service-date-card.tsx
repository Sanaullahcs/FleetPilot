"use client";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ScheduleIcon } from "@/components/dashboard/stat-icons";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const today = todayIso();
  if (iso === today) return "Today";
  const tomorrow = shiftDate(today, 1);
  if (iso === tomorrow) return "Tomorrow";
  const yesterday = shiftDate(today, -1);
  if (iso === yesterday) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function DispatchServiceDateCard({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const isToday = value === todayIso();

  return (
    <div
      className={cn(
        "relative flex h-[4.625rem] flex-col justify-center overflow-hidden rounded-xl border border-slate-200/70 bg-white px-3 shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.cyan }} />
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.06]"
        style={{ background: `radial-gradient(circle, ${brand.cyan} 0%, transparent 70%)` }}
        aria-hidden
      />

      <div className="relative flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
          style={{ background: brand.cyan }}
        >
          <ScheduleIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="fp-label text-[10px] leading-tight">Service date</p>
          <p className="truncate text-sm font-bold tabular-nums text-brand-secondary">{formatDisplayDate(value)}</p>
          <div className="mt-0.5 flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => onChange(shiftDate(value, -1))}
              className="rounded px-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-brand-primary"
            >
              ‹
            </button>
            <input
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-[11px] font-medium tabular-nums text-slate-500 outline-none [color-scheme:light]"
              aria-label="Pick service date"
            />
            <button
              type="button"
              aria-label="Next day"
              onClick={() => onChange(shiftDate(value, 1))}
              className="rounded px-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-brand-primary"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(todayIso())}
          className="absolute bottom-1 right-2 text-[10px] font-semibold text-brand-primary hover:underline"
        >
          Today
        </button>
      )}
    </div>
  );
}
