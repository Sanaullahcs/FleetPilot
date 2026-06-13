"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ScheduleIcon } from "@/components/dashboard/stat-icons";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function shiftMonth(viewMonth: string, delta: number) {
  const [y, m] = viewMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

function formatPickerDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function monthLabel(viewMonth: string) {
  const [y, m] = viewMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString([], { month: "long", year: "numeric" });
}

function buildCalendarDays(viewMonth: string) {
  const [y, m] = viewMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(day);
  return cells;
}

function isoFromDay(viewMonth: string, day: number) {
  const [y, m] = viewMonth.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function ServiceDateCalendar({
  value,
  onChange,
  onClose,
  anchorRect,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [viewMonth, setViewMonth] = useState(value.slice(0, 7));
  const panelRef = useRef<HTMLDivElement>(null);
  const today = todayIso();
  const days = buildCalendarDays(viewMonth);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  const width = 288;
  const left = Math.max(8, Math.min(anchorRect.right - width, window.innerWidth - width - 8));
  const top = anchorRect.bottom + 6;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Pick service date"
      className="fixed z-[200] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-brand-primary/10"
      style={{ top, left, width }}
    >
      <div className="h-0.5 w-full" style={{ background: brand.cyan }} />

      <div className="flex items-center justify-between border-b border-slate-100 bg-brand-light/40 px-3 py-2.5">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-brand-primary"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-brand-secondary">{monthLabel(viewMonth)}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-brand-primary"
        >
          ›
        </button>
      </div>

      <div className="p-3">
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((label) => (
            <span key={label} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, index) => {
            if (day === null) {
              return <span key={`empty-${index}`} aria-hidden />;
            }
            const iso = isoFromDay(viewMonth, day);
            const selected = iso === value;
            const isToday = iso === today;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  onChange(iso);
                  onClose();
                }}
                className={cn(
                  "flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium tabular-nums transition",
                  selected
                    ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/25"
                    : isToday
                      ? "bg-brand-light text-brand-primary ring-1 ring-brand-primary/30"
                      : "text-slate-700 hover:bg-slate-100 hover:text-brand-primary",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-brand-primary"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(today);
            setViewMonth(today.slice(0, 7));
            onClose();
          }}
          className="rounded-lg bg-brand-primary px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-primaryDark"
        >
          Today
        </button>
      </div>
    </div>,
    document.body,
  );
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const pickerId = useId();
  const isToday = value === todayIso();

  const openPicker = () => {
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
      setOpen(true);
    }
  };

  return (
    <>
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
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-brand-primary"
              >
                ‹
              </button>
              <button
                ref={triggerRef}
                type="button"
                id={pickerId}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={openPicker}
                className="min-w-0 flex-1 truncate rounded-md px-1 py-0.5 text-left text-[11px] font-medium tabular-nums text-slate-500 transition hover:bg-brand-light/60 hover:text-brand-primary"
              >
                {formatPickerDate(value)}
              </button>
              <button
                type="button"
                aria-label="Next day"
                onClick={() => onChange(shiftDate(value, 1))}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-brand-primary"
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

      {open && anchorRect ? (
        <ServiceDateCalendar
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          anchorRect={anchorRect}
        />
      ) : null}
    </>
  );
}
