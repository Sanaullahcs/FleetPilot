"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import { CompactQuickActions } from "@/components/dashboard/quick-action-tile";
import { DonutChart, FleetBarChart, RoutesByTypeChart } from "@/components/dashboard/charts";
import {
  AlertCircleIcon,
  DispatchIcon,
  DriverIcon,
  ProgressIcon,
  RouteIcon,
  SchoolIcon,
  VehicleIcon,
} from "@/components/dashboard/stat-icons";
import { DashboardChartsSkeleton, DashboardStatsSkeleton } from "@/components/ui/skeleton";
import { getContractorPortal } from "@/lib/resources";
import { useAuthStore } from "@/store/auth";
import { brand } from "@/lib/brand";
import { getDashboardWelcome } from "@/lib/portal";
import { cn, titleCase } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

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

export default function MyContractsPage() {
  const user = useAuthStore((s) => s.user);
  const welcome = getDashboardWelcome(user?.role, user?.first_name ?? "");
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["contractor-portal"],
    queryFn: getContractorPortal,
  });

  const summary = data?.summary;
  const analytics = data?.analytics;
  const initialLoading = isLoading && !data;

  const quickActions = [
    { href: "/dashboard/dispatch", label: "Dispatch", accent: brand.primary },
    { href: "/dashboard/radar", label: "Radar", accent: brand.cyan },
    { href: "/dashboard/drivers", label: "Drivers", accent: brand.accent },
    { href: "/dashboard/messages", label: "Messages", accent: brand.orange },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={welcome.title}
        description={`${welcome.description}${user?.organization ? ` · ${user.organization.name}` : ""}`}
        action={
          <Link href="/dashboard/dispatch">
            <Button>Today&apos;s dispatch</Button>
          </Link>
        }
      />

      {isError && (
        <div className="fp-card flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-brand-secondary">Unable to load your contract overview.</p>
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

      {!isError && summary && data ? (
        <>
          {summary.unassigned_today > 0 ? (
            <Link
              href="/dashboard/dispatch"
              className="group flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 transition hover:bg-amber-100/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
                  <AlertCircleIcon />
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    {summary.unassigned_today} run{summary.unassigned_today === 1 ? "" : "s"} need a driver today
                  </p>
                  <p className="mt-0.5 text-sm text-amber-900/80">
                    Assign your drivers and vehicles on the dispatch board before service starts.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                Go to dispatch
                <RowArrow className="text-white/80 group-hover:text-white" />
              </span>
            </Link>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
            <Link href="/dashboard/schools" className="block">
              <DashboardStatTile
                label="Schools"
                value={summary.schools}
                hint="Delegated to you"
                accent={brand.orange}
                icon={<SchoolIcon />}
              />
            </Link>
            <Link href="/dashboard/routes" className="block">
              <DashboardStatTile
                label="Routes"
                value={summary.routes}
                hint="Under your contract"
                accent={brand.primaryDark}
                icon={<RouteIcon />}
              />
            </Link>
            <Link href="/dashboard/dispatch" className="block">
              <DashboardStatTile
                label="Runs Today"
                value={summary.runs_today}
                hint={`${summary.assigned_today} assigned · ${summary.unassigned_today} open`}
                accent={brand.chart[5]}
                icon={<DispatchIcon />}
              />
            </Link>
            <Link href="/dashboard/radar" className="block">
              <DashboardStatTile
                label="In Progress"
                value={summary.in_progress_today}
                hint="Live Now"
                accent={brand.cyan}
                icon={<ProgressIcon />}
              />
            </Link>
            <Link href="/dashboard/drivers" className="block">
              <DashboardStatTile
                label="My Drivers"
                value={summary.drivers}
                hint={`${summary.active_drivers} active`}
                accent={brand.cyan}
                icon={<DriverIcon />}
              />
            </Link>
            <Link href="/dashboard/vehicles" className="block">
              <DashboardStatTile
                label="My Vehicles"
                value={summary.vehicles}
                hint={`${summary.active_vehicles} in service`}
                accent={brand.accent}
                icon={<VehicleIcon />}
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
                <div className="relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.chart[5] }} />
                  <DonutChart
                    title="Today's dispatch"
                    subtitle={today}
                    data={analytics.today_dispatch}
                    compact
                    colorOffset={4}
                  />
                </div>
                <div className="relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.cyan }} />
                  <DonutChart
                    title="Driver Status"
                    subtitle="Your Roster"
                    data={analytics.driver_status}
                    compact
                    colorOffset={3}
                  />
                </div>
                <div className="relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-1">
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: brand.accent }} />
                  <DonutChart
                    title="Vehicle Status"
                    subtitle="Your Fleet Units"
                    data={analytics.vehicle_status}
                    compact
                    colorOffset={1}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="fp-card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-brand-secondary">Delegated contracts</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Schools and routes your provider assigned to {data.contractor.company_name ?? data.contractor.name}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.assignments.length ? (
                  data.assignments.map((a) => {
                    const href = a.school ? "/dashboard/schools" : "/dashboard/routes";
                    return (
                      <Link
                        key={a.id}
                        href={href}
                        className="group flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50/80 sm:px-6"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-4 [&_svg]:w-4",
                              a.school ? "bg-sky-500" : "bg-violet-500",
                            )}
                          >
                            {a.school ? <SchoolIcon /> : <RouteIcon />}
                          </span>
                          <div className="min-w-0">
                            {a.school ? (
                              <>
                                <p className="font-semibold text-brand-secondary">{a.school.name}</p>
                                <p className="mt-0.5 text-sm text-slate-500">
                                  Whole school · all routes{a.school.city ? ` · ${a.school.city}` : ""}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-brand-secondary">{a.route?.name}</p>
                                <p className="mt-0.5 text-sm text-slate-500">
                                  {TYPE_LABELS[a.route?.type ?? ""] ?? titleCase(a.route?.type ?? "Route")}
                                  {a.route?.school?.name ? ` · ${a.route.school.name}` : ""}
                                  {a.route?.code ? ` · ${a.route.code}` : ""}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            className={
                              a.school
                                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                                : "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                            }
                          >
                            {a.school ? "School" : "Route"}
                          </Badge>
                          <RowArrow />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
                    Your provider hasn&apos;t assigned any schools or routes yet. You&apos;ll see them here once they do.
                  </p>
                )}
              </div>
            </article>

            <article className="fp-card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-brand-secondary">Today&apos;s snapshot</h2>
                <p className="mt-0.5 text-sm text-slate-500">{today}</p>
              </div>
              <div className="space-y-3 px-5 py-4 sm:px-6">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Service board</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-secondary">{summary.runs_today}</p>
                  <p className="text-sm text-slate-500">
                    run{summary.runs_today === 1 ? "" : "s"} scheduled for today
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Assigned</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-900">{summary.assigned_today}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Open</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-950">{summary.unassigned_today}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Your fleet</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {summary.active_drivers} active driver{summary.active_drivers === 1 ? "" : "s"} ·{" "}
                    {summary.active_vehicles} vehicle{summary.active_vehicles === 1 ? "" : "s"} ready
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href="/dashboard/dispatch">
                    <Button size="sm">Open Dispatch</Button>
                  </Link>
                  <Link href="/dashboard/vehicles">
                    <Button size="sm" variant="secondary">
                      My Vehicles
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          </div>

          <article className="fp-card overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-brand-secondary">Routes you operate</h2>
                <p className="mt-0.5 text-sm text-slate-500">Active routes under your contract</p>
              </div>
              <Link href="/dashboard/dispatch" className="text-sm font-semibold text-brand-primary hover:underline">
                Open dispatch →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data.routes.length ? (
                data.routes.map((route) => (
                  <Link
                    key={route.id}
                    href="/dashboard/dispatch"
                    className="group flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition hover:bg-slate-50/80 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white [&_svg]:h-4 [&_svg]:w-4">
                        <RouteIcon />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-secondary">{route.name}</p>
                        <p className="text-sm text-slate-500">
                          {route.school?.name ?? "—"}
                          {route.code ? ` · ${route.code}` : ""}
                          {route.type ? ` · ${TYPE_LABELS[route.type] ?? titleCase(route.type)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge className="bg-brand-light text-brand-primary ring-1 ring-brand-primary/15">
                        {route.runs_count ?? 0} run{(route.runs_count ?? 0) === 1 ? "" : "s"}
                      </Badge>
                      <RowArrow />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
                  No routes are linked to your contract yet.
                </p>
              )}
            </div>
          </article>
        </>
      ) : null}
    </div>
  );
}
