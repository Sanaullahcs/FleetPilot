"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import { MessageIcon, RouteIcon, ScheduleIcon, StudentsIcon } from "@/components/dashboard/stat-icons";
import { PageState } from "@/components/ui/page-state";
import { StatusChip } from "@/components/dashboard/status-chip";
import { ContactCell } from "@/components/ui/contact-cell";
import { getSchoolPortal } from "@/lib/resources";
import { brand } from "@/lib/brand";
import { titleCase } from "@/lib/utils";

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

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

export default function MySchoolPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["school-portal"],
    queryFn: getSchoolPortal,
  });

  const school = data?.school;
  const stats = data?.stats;
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={school?.name ?? "My school"}
        description={
          school
            ? `${school.district ?? "District"} · ${school.grade_levels ?? "All grades"} · Read-only school transportation view`
            : "School transportation overview for your campus."
        }
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && !school}
        emptyMessage="Your account is not linked to a school yet. Contact your transportation administrator."
      >
        {school && stats ? (
          <>
            {data?.alerts?.length ? (
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border px-4 py-3 ${
                      alert.severity === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : alert.severity === "danger"
                          ? "border-red-200 bg-red-50"
                          : "border-sky-200 bg-sky-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-brand-secondary">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatTile label="Active students" value={stats.students_active} hint={`${stats.students_total} enrolled`} accent={brand.primary} icon={<StudentsIcon />} />
              <DashboardStatTile label="Active routes" value={stats.routes_active} hint="Serving your school" accent={brand.orange} icon={<RouteIcon />} />
              <DashboardStatTile label="Runs today" value={stats.runs_today} hint={today} accent={brand.cyan} icon={<ScheduleIcon />} />
              <Link href="/dashboard/messages" className="block">
                <DashboardStatTile label="Messages" value="Open" hint="Parent ↔ school chat" accent={brand.accent} icon={<MessageIcon />} />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/complaints">
                <Button variant="secondary">Register a complaint</Button>
              </Link>
              <Link href="/dashboard/messages">
                <Button variant="secondary">Open messages</Button>
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="fp-card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-lg font-bold text-brand-secondary">Today&apos;s service</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Assigned runs for {today}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.today_assignments.length ? (
                    data.today_assignments.map((item) => (
                      <div key={item.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-brand-secondary">{item.run?.name ?? "Run"}</p>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {item.route?.name ?? "Route"} · {TYPE_LABELS[item.route?.type ?? ""] ?? item.route?.type}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {directionLabel(item.run?.direction)} · {formatTime(item.run?.scheduled_start_time)}
                            </p>
                          </div>
                          <StatusChip status={item.status} />
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {item.driver ? (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Driver</p>
                              <p className="text-sm font-medium text-slate-800">{item.driver.full_name}</p>
                              {item.driver.phone ? (
                                <ContactCell email={null} phone={item.driver.phone} />
                              ) : null}
                            </div>
                          ) : null}
                          {item.vehicle ? (
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Vehicle</p>
                              <p className="text-sm font-medium text-slate-800">#{item.vehicle.vehicle_number}</p>
                              <p className="text-xs text-slate-500">{titleCase(item.vehicle.type.replace(/_/g, " "))}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="px-5 py-8 text-sm text-slate-500">No runs are scheduled for your school today.</p>
                  )}
                </div>
              </article>

              <article className="fp-card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-lg font-bold text-brand-secondary">School profile</h2>
                </div>
                <div className="space-y-3 px-5 py-4 text-sm text-slate-600">
                  {school.code ? <p><span className="font-semibold text-slate-800">Code:</span> {school.code}</p> : null}
                  {school.principal_name ? <p><span className="font-semibold text-slate-800">Principal:</span> {school.principal_name}</p> : null}
                  {school.address ? (
                    <p>
                      <span className="font-semibold text-slate-800">Address:</span>{" "}
                      {[school.address, school.city, school.state, school.zip].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                  {school.phone ? <ContactCell email={null} phone={school.phone} /> : null}
                  {school.bell_times ? (
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Bell times</p>
                      <p className="mt-1 text-sm">AM {school.bell_times.am_bell ?? "—"} · PM {school.bell_times.pm_dismissal ?? "—"}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href="/dashboard/students">
                      <Button variant="secondary">View students</Button>
                    </Link>
                    <Link href="/dashboard/routes">
                      <Button variant="secondary">View routes</Button>
                    </Link>
                  </div>
                </div>
              </article>
            </div>

            <article className="fp-card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-bold text-brand-secondary">Active routes</h2>
                <p className="mt-0.5 text-sm text-slate-500">Runs configured for your school</p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.routes.length ? (
                  data.routes.map((route) => (
                    <div key={route.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-brand-secondary">{route.name}</p>
                          <p className="text-sm text-slate-500">{route.code ?? "—"} · {TYPE_LABELS[route.type] ?? route.type}</p>
                        </div>
                        <Badge>{route.runs_count} run{route.runs_count === 1 ? "" : "s"}</Badge>
                      </div>
                      {route.runs.length ? (
                        <ul className="mt-3 space-y-1 text-xs text-slate-500">
                          {route.runs.map((run) => (
                            <li key={run.id}>
                              {run.name} · {directionLabel(run.direction)} · {formatTime(run.scheduled_start_time)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="px-5 py-8 text-sm text-slate-500">No active routes are linked to your school yet.</p>
                )}
              </div>
            </article>
          </>
        ) : null}
      </PageState>
    </div>
  );
}
