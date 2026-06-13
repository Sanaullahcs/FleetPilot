"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { CompactQuickActions } from "@/components/dashboard/quick-action-tile";
import { PortalStatTile } from "@/components/dashboard/portal-action-card";
import { PageState } from "@/components/ui/page-state";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { RouteIcon, ScheduleIcon, MessageIcon, HeadsetIcon } from "@/components/dashboard/stat-icons";
import { getDriverToday } from "@/lib/resources";
import { brand } from "@/lib/brand";
import { getDashboardWelcome } from "@/lib/portal";
import {
  formatScheduleState,
  scheduleStateClass,
} from "@/lib/driver-schedule";
import { cn, titleCase } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import type { DriverPortalRun } from "@/lib/types";

function formatTime(time: string | null | undefined) {
  if (!time) return "—";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m?.slice(0, 2) ?? "00"} ${ampm}`;
}

function directionLabel(direction: string | null | undefined) {
  if (direction === "to_school") return "To School";
  if (direction === "from_school") return "From School";
  return direction ? titleCase(direction.replace(/_/g, " ")) : "—";
}

function RunCard({ run }: { run: DriverPortalRun }) {
  const state = run.schedule_state ?? run.status;
  const school = run.route?.school?.name ?? "School TBD";
  const routeCode = run.route?.code ? `${run.route.code} · ${run.route.name}` : run.route?.name ?? "Route pending";

  return (
    <article className="fp-panel overflow-hidden">
      <div className="h-0.5 bg-brand-primary" />
      <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-brand-secondary">{run.run?.name ?? "Run assignment"}</h3>
              <Badge className="text-[10px]">Today</Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">{school}</p>
          </div>
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset", scheduleStateClass(state))}>
            {formatScheduleState(state)}
          </span>
        </div>
      </div>
      <dl className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Route" value={routeCode} />
        <Fact
          label="Window"
          value={`${formatTime(run.run?.scheduled_start_time)} – ${formatTime(run.run?.scheduled_end_time)}`}
        />
        <Fact label="Direction" value={directionLabel(run.run?.direction)} />
        <Fact
          label="Vehicle"
          value={
            run.vehicle
              ? `#${run.vehicle.vehicle_number} · ${formatVehicleType(run.vehicle.type)}`
              : "Not assigned"
          }
        />
      </dl>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 px-4 py-2 sm:border-l sm:border-t-0 sm:first:border-l-0 sm:px-5">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default function DriverTodayPage() {
  const user = useAuthStore((s) => s.user);
  const welcome = getDashboardWelcome(user?.role, user?.first_name ?? "");

  const todayQuery = useQuery({
    queryKey: ["driver-today"],
    queryFn: getDriverToday,
    refetchInterval: 30_000,
  });

  const data = todayQuery.data;
  const runs = data?.runs ?? [];
  const summary = data?.summary;

  const quickActions = [
    { href: "/dashboard/my-schedule", label: "Schedule", accent: brand.primary },
    { href: "/dashboard/messages", label: "Messages", accent: brand.accent },
    { href: "/dashboard/alerts", label: "Alerts", accent: brand.cyan },
    { href: "/dashboard/support", label: "Help", accent: brand.orange },
  ];

  const dateLine = data?.date ? `Today · ${data.date}` : "Today's route assignments";

  return (
    <div className="space-y-5">
      <PageHeader
        compact
        eyebrow="Driver Portal"
        title={welcome.title}
        description={dateLine}
        action={
          <Link href="/dashboard/my-schedule">
            <Button size="sm" variant="secondary">
              Full schedule
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <LiveIndicator label="Synced" />
        <span>Mobile sync · refreshes every 30s</span>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <PortalStatTile label="Runs Today" value={summary.total} hint="Assigned" accent={brand.primary} icon={<RouteIcon />} />
          <PortalStatTile label="In Progress" value={summary.in_progress} hint="Active now" accent={brand.cyan} icon={<ScheduleIcon />} />
          <Link href="/dashboard/messages" className="block">
            <PortalStatTile label="Messages" value="Open" hint="Dispatch & parents" accent={brand.accent} icon={<MessageIcon />} />
          </Link>
          <Link href="/dashboard/support" className="block">
            <PortalStatTile label="Support" value="Help" hint="Contact dispatch" accent={brand.orange} icon={<HeadsetIcon />} />
          </Link>
        </div>
      ) : null}

      <CompactQuickActions flat items={quickActions} />

      <PageState
        isLoading={todayQuery.isLoading}
        isError={todayQuery.isError}
        onRetry={() => void todayQuery.refetch()}
        isEmpty={!todayQuery.isLoading && runs.length === 0}
        emptyMessage="No runs assigned for today yet. Check back later or contact dispatch if you expected an assignment."
      >
        <div className="space-y-2.5">
          {runs.map((run) => (
            <RunCard key={run.assignment_id} run={run} />
          ))}
        </div>
      </PageState>
    </div>
  );
}
