"use client";

import { useState } from "react";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { StatusChip } from "@/components/dashboard/status-chip";
import { ParentLiveTracker } from "@/components/dashboard/parent-live-tracker";
import { PortalAvatar } from "@/components/dashboard/portal-action-card";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { ContactCell } from "@/components/ui/contact-cell";
import { getParentChildren } from "@/lib/resources";
import { brand } from "@/lib/brand";
import { titleCase } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const TYPE_LABELS: Record<string, string> = {
  am: "Morning",
  pm: "Afternoon",
  midday: "Midday",
  activity: "Activity",
  sped: "Special ed",
  charter: "Charter",
};

const ROUTE_ACCENT: Record<string, string> = {
  am: brand.orange,
  pm: brand.primary,
  midday: brand.cyan,
  activity: brand.accent,
  sped: brand.chart[4],
  charter: brand.chart[5],
};

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

export default function MyChildrenPage() {
  const [focusStudentId, setFocusStudentId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parent-children"],
    queryFn: getParentChildren,
  });

  const children = data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        compact
        eyebrow="Parent Portal"
        title="My Children"
        description="Track live routes and view today's schedule for linked students."
      />

      {children.length > 0 && (
        <ParentLiveTracker focusStudentId={focusStudentId} onFocusHandled={() => setFocusStudentId(null)} />
      )}

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && children.length === 0}
        emptyMessage="No students are linked to your account yet. Ask your transportation administrator to assign your children to your parent profile."
      >
        <div className="space-y-3">
          {children.map((item) => {
            const fullName = `${item.student.first_name} ${item.student.last_name}`;
            return (
              <article key={item.student.id} className="fp-panel overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PortalAvatar name={fullName} accent={brand.primary} />
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-brand-secondary">{fullName}</h2>
                        <p className="text-[11px] text-slate-500">
                          {item.student.student_number ? `#${item.student.student_number}` : "Student"}
                          {item.student.grade ? ` · Grade ${item.student.grade}` : ""}
                        </p>
                        {item.school ? (
                          <p className="truncate text-[11px] text-slate-500">
                            {item.school.name}
                            {item.school.city ? ` · ${item.school.city}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setFocusStudentId(item.student.id)}>
                        Track live
                      </Button>
                      <StatusChip status={item.student.status} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Assigned driver</h3>
                    {item.assigned_driver ? (
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.assigned_driver.first_name} {item.assigned_driver.last_name}
                        </p>
                        {item.assigned_driver.employee_id ? (
                          <p className="text-[11px] text-slate-500">{item.assigned_driver.employee_id}</p>
                        ) : null}
                        <ContactCell
                          phone={item.assigned_driver.phone}
                          email={item.assigned_driver.email}
                          className="mt-1.5"
                        />
                        {item.assigned_driver.vehicle ? (
                          <p className="mt-1.5 text-xs text-slate-600">
                            Vehicle{" "}
                            <span className="font-semibold">{item.assigned_driver.vehicle.vehicle_number}</span>
                            {" · "}
                            {formatVehicleType(item.assigned_driver.vehicle.type)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No driver assigned yet.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Runs today · {item.service_date}
                    </h3>
                    {item.routes_today.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No routes scheduled for today.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {item.routes_today.map((route) =>
                          route.runs.map((run) => {
                            const accent = ROUTE_ACCENT[route.type] ?? brand.primary;
                            return (
                              <li key={run.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="h-0.5" style={{ background: accent }} />
                                <div className="px-3 py-2.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-brand-secondary">{run.name}</p>
                                    <Badge className="text-[10px]">{TYPE_LABELS[route.type] ?? route.type}</Badge>
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    {directionLabel(run.direction)} · {formatTime(run.scheduled_start_time)} –{" "}
                                    {formatTime(run.scheduled_end_time)}
                                  </p>
                                  {run.assignment ? (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                      <StatusChip status={run.assignment.status} />
                                      {run.assignment.driver ? (
                                        <span className="text-xs text-slate-700">
                                          {run.assignment.driver.first_name} {run.assignment.driver.last_name}
                                        </span>
                                      ) : null}
                                      {run.assignment.vehicle ? (
                                        <span className="text-[11px] text-slate-500">
                                          · {run.assignment.vehicle.vehicle_number}
                                        </span>
                                      ) : null}
                                      {run.assignment.status === "in_progress" ? (
                                        <button
                                          type="button"
                                          onClick={() => setFocusStudentId(item.student.id)}
                                          className="text-[11px] font-semibold text-brand-primary hover:underline"
                                        >
                                          View on map
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <p className="mt-1.5 text-[11px] text-amber-700">Bus not assigned yet for today.</p>
                                  )}
                                </div>
                              </li>
                            );
                          }),
                        )}
                      </ul>
                    )}
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      </PageState>

      {children.length > 0 ? (
        <div className="fp-panel px-4 py-3 text-xs text-slate-600">
          <p className="font-semibold text-brand-secondary">Need to add another child?</p>
          <p className="mt-1 leading-relaxed">
            Your transportation administrator links students from{" "}
            <span className="font-medium text-slate-800">Students → Manage parents</span>. Parents cannot add children
            themselves for security.
          </p>
        </div>
      ) : null}
    </div>
  );
}
