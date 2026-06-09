"use client";

import { useState } from "react";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { StatusChip } from "@/components/dashboard/status-chip";
import { ParentLiveTracker } from "@/components/dashboard/parent-live-tracker";
import { formatVehicleType } from "@/components/dashboard/assignment-ui";
import { ContactCell } from "@/components/ui/contact-cell";
import { getParentChildren } from "@/lib/resources";
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

export default function MyChildrenPage() {
  const [focusStudentId, setFocusStudentId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parent-children"],
    queryFn: getParentChildren,
  });

  const children = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My children"
        description="Track your child's bus live and view today's routes. Only students linked to your account appear here."
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
        <div className="space-y-5">
          {children.map((item) => (
            <article key={item.student.id} className="fp-card overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-r from-brand-primary/5 to-white px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {item.student.first_name} {item.student.last_name}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {item.student.student_number ? `#${item.student.student_number}` : "Student"}
                      {item.student.grade ? ` · Grade ${item.student.grade}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setFocusStudentId(item.student.id)}>
                      Track live
                    </Button>
                    <StatusChip status={item.student.status} />
                  </div>
                </div>
                {item.school && (
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{item.school.name}</span>
                    {item.school.city ? ` · ${item.school.city}` : ""}
                  </p>
                )}
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Assigned driver</h3>
                  {item.assigned_driver ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="font-semibold text-slate-900">
                        {item.assigned_driver.first_name} {item.assigned_driver.last_name}
                      </p>
                      {item.assigned_driver.employee_id && (
                        <p className="text-xs text-slate-500">{item.assigned_driver.employee_id}</p>
                      )}
                      <ContactCell
                        phone={item.assigned_driver.phone}
                        email={item.assigned_driver.email}
                        className="mt-2"
                      />
                      {item.assigned_driver.vehicle && (
                        <p className="mt-2 text-sm text-slate-600">
                          Vehicle:{" "}
                          <span className="font-medium">{item.assigned_driver.vehicle.vehicle_number}</span>
                          {" · "}
                          {formatVehicleType(item.assigned_driver.vehicle.type)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No driver assigned yet.</p>
                  )}
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Today&apos;s routes · {item.service_date}
                  </h3>
                  {item.routes_today.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No routes scheduled for today.</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {item.routes_today.map((route) =>
                        route.runs.map((run) => (
                          <li
                            key={run.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{run.name}</p>
                              <Badge className="bg-slate-100 text-slate-700">
                                {TYPE_LABELS[route.type] ?? route.type}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {directionLabel(run.direction)} · {formatTime(run.scheduled_start_time)} –{" "}
                              {formatTime(run.scheduled_end_time)}
                            </p>
                            {run.assignment ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                <StatusChip status={run.assignment.status} />
                                {run.assignment.driver && (
                                  <span className="text-slate-700">
                                    {run.assignment.driver.first_name} {run.assignment.driver.last_name}
                                  </span>
                                )}
                                {run.assignment.vehicle && (
                                  <span className="text-slate-500">
                                    · {run.assignment.vehicle.vehicle_number}
                                  </span>
                                )}
                                {run.assignment.status === "in_progress" && (
                                  <button
                                    type="button"
                                    onClick={() => setFocusStudentId(item.student.id)}
                                    className="text-xs font-semibold text-brand-primary hover:underline"
                                  >
                                    View on map
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-amber-700">Bus not assigned yet for today.</p>
                            )}
                          </li>
                        )),
                      )}
                    </ul>
                  )}
                </section>
              </div>
            </article>
          ))}
        </div>
      </PageState>

      {children.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Need to add another child?</p>
          <p className="mt-1">
            Your transportation administrator links students to parent accounts from{" "}
            <strong>Students → Manage parents</strong>. Parents cannot add children themselves for security.
          </p>
        </div>
      )}
    </div>
  );
}
