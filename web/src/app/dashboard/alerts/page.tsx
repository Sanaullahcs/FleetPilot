"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import {
  listMobileNotifications,
  markAllMobileNotificationsRead,
  markMobileNotificationRead,
} from "@/lib/resources";
import type { MobileNotification, MobileNotificationSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

function severityStyles(severity: MobileNotificationSeverity) {
  if (severity === "danger") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  if (severity === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function notificationHref(item: MobileNotification): string | null {
  if (item.conversation_id) return "/dashboard/messages";
  if (item.complaint_id) return "/dashboard/complaints";
  return null;
}

function AlertRow({
  item,
  onMarkRead,
}: {
  item: MobileNotification;
  onMarkRead: (id: string) => void;
}) {
  const href = notificationHref(item);

  const content = (
    <div
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3.5 transition",
        item.read ? "border-slate-100 bg-white" : "border-brand-primary/20 bg-brand-light/20",
      )}
    >
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold", severityStyles(item.severity))}>
        !
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <span className="shrink-0 text-[11px] text-slate-400">{formatTime(item.time)}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!item.read ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(item.id);
              }}
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              Mark read
            </button>
          ) : (
            <span className="text-xs text-slate-400">Read</span>
          )}
          {href ? (
            <span className="text-xs font-semibold text-brand-primary">Open →</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={() => !item.read && onMarkRead(item.id)}>
        {content}
      </Link>
    );
  }

  return content;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: () => listMobileNotifications(true),
    refetchInterval: 8_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markMobileNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllMobileNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] }),
  });

  const items = notificationsQuery.data?.items ?? [];
  const unread = notificationsQuery.data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Route updates, messages, complaints, and transportation notices — synced with your mobile app."
        action={
          unread > 0 ? (
            <Button variant="secondary" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <LiveIndicator />
        <span>
          {unread > 0 ? `${unread} unread alert${unread === 1 ? "" : "s"}` : "All caught up"}
        </span>
      </div>

      <PageState
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
        onRetry={() => void notificationsQuery.refetch()}
        isEmpty={!notificationsQuery.isLoading && items.length === 0}
        emptyMessage="No alerts yet. Route changes, messages, and complaint updates will appear here."
      >
        <div className="space-y-2">
          {items.map((item) => (
            <AlertRow key={item.id} item={item} onMarkRead={(id) => markReadMutation.mutate(id)} />
          ))}
        </div>
      </PageState>
    </div>
  );
}
