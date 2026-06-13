"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import { CompactQuickActions } from "@/components/dashboard/quick-action-tile";
import { DonutChart, FleetBarChart, RoutesByTypeChart } from "@/components/dashboard/charts";
import {
  DispatchIcon,
  DriverIcon,
  MessageIcon,
  ProgressIcon,
  RouteIcon,
  ScheduleIcon,
  StudentsIcon,
} from "@/components/dashboard/stat-icons";
import { DashboardChartsSkeleton, DashboardStatsSkeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/dashboard/status-chip";
import { getSchoolPortal } from "@/lib/resources";
import { useAuthStore } from "@/store/auth";
import { brand } from "@/lib/brand";
import { getDashboardWelcome } from "@/lib/portal";
import { cn, titleCase } from "@/lib/utils";
import type { SchoolPortalAssignment, SchoolPortalPayload, SchoolPortalRoute } from "@/lib/types";

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

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

const ROUTE_TYPE_STYLE: Record<string, { accent: string; chip: string }> = {
  am: { accent: brand.orange, chip: "bg-orange-50 text-orange-800 ring-1 ring-orange-200" },
  pm: { accent: brand.chart[4], chip: "bg-violet-50 text-violet-800 ring-1 ring-violet-200" },
  midday: { accent: brand.cyan, chip: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200" },
  activity: { accent: brand.success, chip: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" },
  sped: { accent: brand.chart[4], chip: "bg-violet-50 text-violet-800 ring-1 ring-violet-200" },
  charter: { accent: brand.chart[10], chip: "bg-rose-50 text-rose-800 ring-1 ring-rose-200" },
};

function routeStyle(type: string) {
  return ROUTE_TYPE_STYLE[type] ?? {
    accent: brand.primary,
    chip: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
  };
}

function RowArrow({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-primary", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type TemplateRun = {
  id: string;
  name: string;
  direction: string;
  scheduled_start_time: string | null;
  routeName: string;
  routeType: string;
  routeCode: string | null;
};

function buildTemplateRuns(routes: SchoolPortalRoute[]): TemplateRun[] {
  return routes
    .flatMap((route) =>
      route.runs.map((run) => ({
        id: run.id,
        name: run.name,
        direction: run.direction,
        scheduled_start_time: run.scheduled_start_time,
        routeName: route.name,
        routeType: route.type,
        routeCode: route.code,
      })),
    )
    .sort((a, b) => (a.scheduled_start_time ?? "").localeCompare(b.scheduled_start_time ?? ""));
}

function TodayServicePanel({
  assignments,
  routes,
  today,
  runsToday,
}: {
  assignments: SchoolPortalAssignment[];
  routes: SchoolPortalRoute[];
  today: string;
  runsToday: number;
}) {
  const hasLive = assignments.length > 0;
  const templateRuns = buildTemplateRuns(routes);

  return (
    <article className="fp-panel overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-brand-secondary">Runs today</h2>
            <p className="text-xs text-slate-500">{today}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              {runsToday} live
            </span>
            <Link
              href="/dashboard/dispatch"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-primary hover:underline"
            >
              Open Board
              <RowArrow />
            </Link>
          </div>
        </div>
      </div>

      {hasLive ? (
        <div className="space-y-2 px-4 py-3 sm:px-5">
          {assignments.map((item) => {
            const style = routeStyle(item.route?.type ?? "am");
            return (
              <Link
                key={item.id}
                href="/dashboard/dispatch"
                className="group block overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-slate-300"
              >
                <div className="h-0.5" style={{ background: style.accent }} />
                <div className="p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-secondary">{item.run?.name ?? "Run"}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.route?.name ?? "Route"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-slate-600">
                        {formatTime(item.run?.scheduled_start_time)}
                      </span>
                      <StatusChip status={item.status} />
                      <RowArrow />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", style.chip)}>
                      {TYPE_LABELS[item.route?.type ?? ""] ?? item.route?.type}
                    </span>
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                      {directionLabel(item.run?.direction)}
                    </span>
                  </div>
                  {(item.driver || item.vehicle) && (
                    <div className="mt-2 grid gap-2 border-t border-slate-100 pt-2 sm:grid-cols-2">
                      {item.driver ? (
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Driver</p>
                          <p className="text-sm font-semibold text-slate-900">{item.driver.full_name}</p>
                        </div>
                      ) : null}
                      {item.vehicle ? (
                        <div>
                          <p className="text-[11px] font-medium text-slate-500">Vehicle</p>
                          <p className="text-sm font-semibold text-slate-900">#{item.vehicle.vehicle_number}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : templateRuns.length ? (
        <div className="space-y-2 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">No live assignments today — weekly templates:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {templateRuns.map((run) => {
              const style = routeStyle(run.routeType);
              return (
                <div key={run.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="h-0.5" style={{ background: style.accent }} />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-secondary">{run.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{run.routeName}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                        {formatTime(run.scheduled_start_time)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", style.chip)}>
                        {TYPE_LABELS[run.routeType] ?? run.routeType}
                      </span>
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                        {directionLabel(run.direction)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/dashboard/dispatch" className="inline-flex text-xs font-semibold text-brand-primary hover:underline">
            View dispatch board →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center px-4 py-8 text-center sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary [&_svg]:h-5 [&_svg]:w-5">
            <ScheduleIcon />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-800">Quiet day on the board</p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">No runs are scheduled or configured for your school yet.</p>
          <Link href="/dashboard/routes" className="mt-4">
            <Button size="sm" variant="secondary">
              View routes
            </Button>
          </Link>
        </div>
      )}
    </article>
  );
}

function SchoolProfilePanel({ school }: { school: NonNullable<SchoolPortalPayload["school"]> }) {
  const initials = (school.code ?? school.name)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const addressLine = [school.address, school.city, school.state, school.zip].filter(Boolean).join(", ");
  const metaLine = [school.district, school.grade_levels, school.code].filter(Boolean).join(" · ");

  return (
    <article className="fp-panel overflow-hidden lg:self-start">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold leading-snug text-brand-secondary">{school.name}</h2>
            {metaLine ? <p className="truncate text-xs text-slate-500">{metaLine}</p> : null}
          </div>
        </div>
      </div>

      <div className="space-y-2 px-4 py-2.5 sm:px-5">
        {(school.principal_name || school.phone) && (
          <div className="grid grid-cols-2 gap-x-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Principal</p>
              <p className="truncate text-sm font-semibold text-slate-900">{school.principal_name ?? "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Office phone</p>
              {school.phone ? (
                <p className="truncate text-sm font-semibold text-slate-900">
                  <a href={`tel:${school.phone.replace(/\D/g, "")}`} className="hover:text-brand-primary">
                    {school.phone}
                  </a>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-900">—</p>
              )}
            </div>
          </div>
        )}

        {addressLine ? (
          <div>
            <p className="text-[11px] font-medium text-slate-500">Address</p>
            <p className="text-sm font-semibold leading-snug text-slate-900">{addressLine}</p>
          </div>
        ) : null}

        {school.bell_times ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-sm">
            <p>
              <span className="text-[11px] font-medium text-slate-500">AM bell </span>
              <span className="font-semibold tabular-nums text-slate-900">{school.bell_times.am_bell ?? "—"}</span>
            </p>
            <p>
              <span className="text-[11px] font-medium text-slate-500">PM dismissal </span>
              <span className="font-semibold tabular-nums text-slate-900">{school.bell_times.pm_dismissal ?? "—"}</span>
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ActiveRoutesGrid({ routes }: { routes: SchoolPortalRoute[] }) {
  return (
    <article className="fp-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-brand-secondary">Active routes</h2>
          <p className="text-xs text-slate-500">{routes.length} route{routes.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/dashboard/routes" className="text-xs font-semibold text-brand-primary hover:underline">
          View All →
        </Link>
      </div>

      {routes.length ? (
        <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
          {routes.map((route) => {
            const style = routeStyle(route.type);
            return (
              <Link
                key={route.id}
                href="/dashboard/routes"
                className="group block overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-slate-300"
              >
                <div className="h-0.5" style={{ background: style.accent }} />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
                        style={{ background: style.accent }}
                      >
                        <RouteIcon />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-secondary">{route.name}</p>
                        <p className="truncate text-xs text-slate-500">{route.code ?? "—"}</p>
                      </div>
                    </div>
                    <RowArrow />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", style.chip)}>
                      {TYPE_LABELS[route.type] ?? route.type}
                    </span>
                    <Badge className="bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700 ring-1 ring-slate-200">
                      {route.runs_count} run{route.runs_count === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {route.runs.length ? (
                    <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                      {route.runs.map((run) => (
                        <li key={run.id} className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                          <span className="truncate">{run.name}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                            {formatTime(run.scheduled_start_time)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-slate-500 sm:px-5">No active routes are linked to your school yet.</p>
      )}
    </article>
  );
}

export default function MySchoolPage() {
  const user = useAuthStore((s) => s.user);
  const welcome = getDashboardWelcome(user?.role, user?.first_name ?? "");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["school-portal"],
    queryFn: getSchoolPortal,
  });

  const school = data?.school;
  const stats = data?.stats;
  const analytics = data?.analytics;
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const initialLoading = isLoading && !data;

  const quickActions = [
    { href: "/dashboard/dispatch", label: "Runs", accent: brand.primary },
    { href: "/dashboard/radar", label: "Radar", accent: brand.cyan },
    { href: "/dashboard/students", label: "Students", accent: brand.orange },
    { href: "/dashboard/parents", label: "Parents", accent: brand.accent },
    { href: "/dashboard/messages", label: "Messages", accent: brand.chart[6] },
    { href: "/dashboard/complaints", label: "Complaints", accent: brand.warning },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={school?.name ?? welcome.title}
        description={
          school
            ? `${school.district ?? "District"} · ${school.grade_levels ?? "All grades"}${user?.organization ? ` · ${user.organization.name}` : ""}`
            : welcome.description
        }
        action={
          <Link href="/dashboard/dispatch">
            <Button>Runs Today</Button>
          </Link>
        }
      />

      {isError && (
        <div className="fp-card flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-brand-secondary">Unable to load your school overview.</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isError && initialLoading && (
        <div className="space-y-6">
          <DashboardStatsSkeleton count={6} />
          <DashboardChartsSkeleton />
        </div>
      )}

      {!isError && !initialLoading && !school && (
        <div className="fp-card px-5 py-10 text-center text-sm text-slate-500">
          Your account is not linked to a school yet. Contact your transportation administrator.
        </div>
      )}

      {!isError && school && stats ? (
        <>
          {data?.alerts?.length ? (
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    alert.severity === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : alert.severity === "danger"
                        ? "border-red-200 bg-red-50"
                        : "border-sky-200 bg-sky-50",
                  )}
                >
                  <p className="text-sm font-semibold text-brand-secondary">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <Link href="/dashboard/students" className="block">
              <DashboardStatTile
                label="Active Students"
                value={stats.students_active}
                hint={`${stats.students_total} enrolled`}
                accent={brand.primary}
                icon={<StudentsIcon />}
              />
            </Link>
            <Link href="/dashboard/routes" className="block">
              <DashboardStatTile
                label="Active Routes"
                value={stats.routes_active}
                hint="Serving Your School"
                accent={brand.orange}
                icon={<RouteIcon />}
              />
            </Link>
            <Link href="/dashboard/dispatch" className="block">
              <DashboardStatTile
                label="Runs Today"
                value={stats.runs_today}
                hint={`${stats.assigned_today ?? 0} assigned`}
                accent={brand.chart[5]}
                icon={<DispatchIcon />}
              />
            </Link>
            <Link href="/dashboard/radar" className="block">
              <DashboardStatTile
                label="In Progress"
                value={stats.in_progress_today ?? 0}
                hint="Live Now"
                accent={brand.cyan}
                icon={<ProgressIcon />}
              />
            </Link>
            <Link href="/dashboard/parents" className="block">
              <DashboardStatTile
                label="Parents"
                value={stats.parents_count ?? 0}
                hint="Linked Families"
                accent={brand.accent}
                icon={<MessageIcon />}
              />
            </Link>
            <Link href="/dashboard/drivers" className="block">
              <DashboardStatTile
                label="Drivers"
                value={stats.drivers_count ?? 0}
                hint="Assigned to Students"
                accent={brand.cyan}
                icon={<DriverIcon />}
              />
            </Link>
          </div>

          <CompactQuickActions items={quickActions} />

          {analytics ? (
            <div className="space-y-3">
              <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:items-stretch">
                <FleetBarChart data={analytics.fleet_overview} />
                <RoutesByTypeChart data={analytics.routes_by_type} />
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="relative flex min-h-[11rem] flex-col overflow-hidden fp-panel p-3">
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.chart[5] }} />
                  <DonutChart
                    title="Today's service"
                    subtitle={today}
                    data={analytics.today_service}
                    compact
                    colorOffset={4}
                  />
                </div>
                <div className="relative flex min-h-[11rem] flex-col overflow-hidden fp-panel p-3">
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.primary }} />
                  <DonutChart
                    title="Student Status"
                    subtitle="Enrollment Breakdown"
                    data={analytics.student_status}
                    compact
                    colorOffset={0}
                  />
                </div>
                <div className="relative flex min-h-[11rem] flex-col overflow-hidden fp-panel p-3 sm:col-span-2 xl:col-span-1">
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.orange }} />
                  <DonutChart
                    title="Students by Grade"
                    subtitle="Your Campus Roster"
                    data={analytics.students_by_grade}
                    compact
                    colorOffset={2}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <TodayServicePanel
              assignments={data.today_assignments}
              routes={data.routes}
              today={today}
              runsToday={stats.runs_today}
            />
            <SchoolProfilePanel school={school} />
          </div>

          <ActiveRoutesGrid routes={data.routes} />
        </>
      ) : null}
    </div>
  );
}
