"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboardNotifications } from "@/lib/resources";
import type { DashboardNotification, NotificationSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<
  NotificationSeverity,
  { icon: string; bg: string; border: string; dot: string }
> = {
  danger: {
    icon: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    dot: "bg-red-500",
  },
  warning: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
  },
  info: {
    icon: "text-brand-primary",
    bg: "bg-brand-primary/5",
    border: "border-brand-primary/10",
    dot: "bg-brand-accent",
  },
};

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a4.5 4.5 0 0 0-4.5 4.5v2.1c0 .5-.2 1-.5 1.4L5.8 14.2A1.5 1.5 0 0 0 7.1 16.5h9.8a1.5 1.5 0 0 0 1.3-2.3l-1.2-2.2a2 2 0 0 1-.5-1.4V7.5A4.5 4.5 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const cls = SEVERITY_STYLES[severity].icon;
  if (severity === "danger") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
        <path d="M8 2.5L2 13h12L8 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 6v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (severity === "warning") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={cls} aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function notificationFingerprint(items: DashboardNotification[]): string {
  return items.map((i) => `${i.id}:${i.count}`).join("|");
}

function NotificationItem({
  item,
  onNavigate,
}: {
  item: DashboardNotification;
  onNavigate: () => void;
}) {
  const styles = SEVERITY_STYLES[item.severity];

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "block border-b border-slate-100 px-4 py-3.5 transition last:border-b-0 hover:bg-slate-50",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            styles.bg,
            styles.border,
          )}
        >
          <SeverityIcon severity={item.severity} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
              {item.count}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.message}</p>
          {item.detail && (
            <p className="mt-1 truncate text-[11px] text-slate-400" title={item.detail}>
              {item.detail}
            </p>
          )}
          <span className="mt-2 inline-flex text-xs font-semibold text-brand-primary">
            {item.action_label} →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const width = 380;
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const storageKey = `fp-notifications-seen-${userId}`;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: getDashboardNotifications,
    refetchInterval: 60_000,
  });

  const items = data?.items ?? [];
  const fingerprint = useMemo(() => notificationFingerprint(items), [items]);

  const [seenFingerprint, setSeenFingerprint] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSeenFingerprint(localStorage.getItem(storageKey));
    } catch {
      setSeenFingerprint(null);
    }
  }, [storageKey]);

  const hasUnread = items.length > 0 && fingerprint !== seenFingerprint;

  const markSeen = useCallback(() => {
    if (!items.length) return;
    try {
      localStorage.setItem(storageKey, fingerprint);
    } catch {
      /* ignore */
    }
    setSeenFingerprint(fingerprint);
  }, [fingerprint, items.length, storageKey]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    markSeen();
    updatePosition();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, updatePosition, markSeen]);

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Notifications"
            className="fp-dropdown-panel animate-dropdown-in overflow-hidden p-0"
            style={{ top: pos.top, left: pos.left, width, minWidth: width, maxWidth: "calc(100vw - 16px)" }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">
                  {items.length
                    ? `${items.length} alert${items.length === 1 ? "" : "s"} need attention`
                    : "You're all caught up"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/5"
              >
                {isFetching ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
              {isLoading && (
                <div className="px-4 py-10 text-center text-sm text-slate-400">Loading alerts…</div>
              )}
              {!isLoading && items.length === 0 && (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No alerts right now</p>
                  <p className="mt-1 text-xs text-slate-500">Fleet compliance and operations look good.</p>
                </div>
              )}
              {items.map((item) => (
                <NotificationItem key={item.id} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5">
                <p className="text-[10px] text-slate-400">
                  Alerts refresh automatically · based on live fleet data
                </p>
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={hasUnread ? `Notifications, ${items.length} alerts` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-600 transition",
          "hover:border-slate-200 hover:bg-white",
          open && "border-slate-200 bg-white",
          hasUnread && "text-brand-primary",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40",
        )}
      >
        <BellIcon />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-[#f8f9fc]">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-red-400 opacity-60" aria-hidden />
        )}
      </button>
      {panel}
    </>
  );
}
