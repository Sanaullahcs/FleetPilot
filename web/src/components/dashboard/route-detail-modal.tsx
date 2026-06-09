"use client";

import { useQuery } from "@tanstack/react-query";
import { Modal, ModalCloseFooter } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/primitives";
import {
  DetailError,
  DetailGrid,
  DetailItem,
  DetailLoading,
  DetailSection,
  DetailStat,
  DetailStats,
} from "@/components/ui/detail-panel";
import { getRoute } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { titleCase } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  am: "Morning (AM)",
  pm: "Afternoon (PM)",
  midday: "Midday",
  activity: "Activity / Athletics",
  sped: "Special Education",
  charter: "Charter / Field Trip",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RouteDetailModal({
  routeId,
  fallbackName,
  onClose,
}: {
  routeId: string | null;
  fallbackName?: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => getRoute(routeId!),
    enabled: Boolean(routeId),
  });

  const route = data;

  return (
    <Modal
      open={Boolean(routeId)}
      onClose={onClose}
      size="lg"
      title={route?.name ?? fallbackName ?? "Route details"}
      description={route?.description ?? "Transportation route configuration and scheduled runs."}
      footer={<ModalCloseFooter onClose={onClose} />}
    >
      {isLoading && <DetailLoading />}
      {isError && (
        <DetailError message={getApiErrorMessage(error, "Could not load route details.")} onRetry={() => refetch()} />
      )}
      {route && (
        <div className="space-y-6">
          <DetailStats>
            <DetailStat label="Scheduled runs" value={route.runs_count ?? route.runs?.length ?? 0} accent />
            <DetailStat label="Type" value={TYPE_LABELS[route.type] ?? titleCase(route.type)} />
            <DetailStat label="Status" value={titleCase(route.status)} />
            <DetailStat label="School" value={route.school?.code ?? "—"} />
          </DetailStats>

          <DetailSection title="Route configuration">
            <DetailGrid>
              <DetailItem label="Route code" value={route.code} mono />
              <DetailItem label="Service type" value={TYPE_LABELS[route.type] ?? titleCase(route.type)} />
              <DetailItem label="Assigned school" value={route.school?.name} />
              <DetailItem label="Status" value={<StatusBadge status={route.status} />} />
              <DetailItem
                label="Days of week"
                value={
                  route.days_of_week?.length
                    ? route.days_of_week.map((d: number) => DAY_LABELS[d] ?? d).join(", ")
                    : "Weekdays (default)"
                }
                className="sm:col-span-2"
              />
              {route.description && (
                <DetailItem label="Description" value={route.description} className="sm:col-span-2" />
              )}
            </DetailGrid>
          </DetailSection>

          {route.runs && route.runs.length > 0 && (
            <DetailSection title="Scheduled runs" description="Active and planned services on this route.">
              <div className="space-y-2">
                {route.runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{run.name}</p>
                      <p className="text-xs text-slate-500">
                        {run.scheduled_start_time?.slice(0, 5) ?? "—"}
                        {run.scheduled_end_time ? ` – ${run.scheduled_end_time.slice(0, 5)}` : ""}
                        {" · "}
                        {titleCase(run.direction?.replace(/_/g, " ") ?? "other")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {run.estimated_duration_minutes != null && (
                        <span>{run.estimated_duration_minutes} min</span>
                      )}
                      {run.estimated_distance_miles != null && (
                        <span>{run.estimated_distance_miles} mi</span>
                      )}
                      <StatusBadge status={run.status} />
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      )}
    </Modal>
  );
}
