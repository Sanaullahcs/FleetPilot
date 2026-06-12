"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import { PageState } from "@/components/ui/page-state";
import { LiveIndicator } from "@/components/dashboard/live-indicator";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { RouteIcon, ScheduleIcon, MessageIcon, HeadsetIcon } from "@/components/dashboard/stat-icons";
import { getDriverToday } from "@/lib/resources";
import { brand } from "@/lib/brand";
import {
  formatScheduleState,
  scheduleStateClass,
} from "@/lib/driver-schedule";
import { cn, titleCase } from "@/lib/utils";
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
  if (direction === "to_school") return "To school";
  if (direction === "from_school") return "From school";
  return direction ? titleCase(direction.replace(/_/g, " ")) : "—";
}

function RunCard({ run }: { run: DriverPortalRun }) {
  const state = run.schedule_state ?? run.status;
  const school = run.route?.school?.name ?? "School TBD";
  const routeCode = run.route?.code ? `${run.route.code} · ${run.route.name}` : run.route?.name ?? "Route pending";

  return (
    <article className="fp-card overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{run.run?.name ?? "Run assignment"}</h3>
              <Badge>Today</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">{school}</p>
          </div>
          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", scheduleStateClass(state))}>
            {formatScheduleState(state)}
          </span>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
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
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function DriverTodayPage() {
  const todayQuery = useQuery({
    queryKey: ["driver-today"],
    queryFn: getDriverToday,
    refetchInterval: 30_000,
  });

  const data = todayQuery.data;
  const runs = data?.runs ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day${data?.driver?.full_name ? `, ${data.driver.full_name.split(" ")[0]}` : ""}`}
        description={data?.date ? `Today's assignments · ${data.date}` : "Today's route assignments"}
        action={
          <Link href="/dashboard/my-schedule">
            <Button variant="secondary">Full schedule</Button>
          </Link>
        }
      />

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <LiveIndicator />
        <span>Synced with mobile · refreshes every 30s</span>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <DashboardStatTile label="Runs today" value={summary.total} hint="Assigned for today" accent={brand.primary} icon={<RouteIcon />} />
          <DashboardStatTile label="In progress" value={summary.in_progress} hint="Active runs" accent={brand.cyan} icon={<ScheduleIcon />} />
          <Link href="/dashboard/messages" className="block">
            <DashboardStatTile label="Messages" value="Open" hint="Dispatch & parents" accent={brand.accent} icon={<MessageIcon />} />
          </Link>
          <Link href="/dashboard/support" className="block">
            <DashboardStatTile label="Support" value="Help" hint="Contact dispatch" accent={brand.orange} icon={<HeadsetIcon />} />
          </Link>
        </div>
      ) : null}

      <PageState
        isLoading={todayQuery.isLoading}
        isError={todayQuery.isError}
        onRetry={() => void todayQuery.refetch()}
        isEmpty={!todayQuery.isLoading && runs.length === 0}
        emptyMessage="No runs assigned for today yet. Check back later or contact dispatch if you expected an assignment."
      >
        <div className="space-y-4">
          {runs.map((run) => (
            <RunCard key={run.assignment_id} run={run} />
          ))}
        </div>
      </PageState>
    </div>
  );
}
