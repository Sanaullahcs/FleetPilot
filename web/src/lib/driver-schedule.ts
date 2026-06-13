import type { DriverScheduleSummary } from "@/lib/types";

export type DriverScheduleRange =
  | "today"
  | "this_week"
  | "last_7"
  | "last_14"
  | "last_30"
  | "next_7"
  | "next_14"
  | "next_30"
  | "rolling_60"
  | "custom";

export type DriverScheduleState =
  | "all"
  | "incoming"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "missed";

export const SCHEDULE_RANGE_OPTIONS: Array<{ id: DriverScheduleRange; label: string; hint: string }> = [
  { id: "today", label: "Today", hint: "Current day only" },
  { id: "this_week", label: "This week", hint: "Mon – Sun" },
  { id: "last_7", label: "Last 7 days", hint: "Recent history" },
  { id: "last_14", label: "Last 14 days", hint: "Two-week history" },
  { id: "last_30", label: "Last 30 days", hint: "Monthly history" },
  { id: "next_7", label: "Next 7 days", hint: "Upcoming week" },
  { id: "next_14", label: "Next 14 days", hint: "Two weeks ahead" },
  { id: "next_30", label: "Next 30 days", hint: "Monthly upcoming" },
  { id: "rolling_60", label: "±30 days", hint: "Past & future window" },
];

export const SCHEDULE_STATUS_FILTERS: Array<{
  id: DriverScheduleState;
  label: string;
  summaryKey?: keyof DriverScheduleSummary;
}> = [
  { id: "all", label: "All statuses", summaryKey: "total" },
  { id: "incoming", label: "Incoming", summaryKey: "incoming" },
  { id: "scheduled", label: "Due today", summaryKey: "scheduled" },
  { id: "in_progress", label: "In Progress", summaryKey: "in_progress" },
  { id: "completed", label: "Completed", summaryKey: "completed" },
  { id: "missed", label: "Missed", summaryKey: "missed" },
  { id: "cancelled", label: "Cancelled", summaryKey: "cancelled" },
];

export function formatScheduleRangeLabel(rangeStart: string, rangeEnd: string) {
  const start = new Date(`${rangeStart}T12:00:00`);
  const end = new Date(`${rangeEnd}T12:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (rangeStart === rangeEnd) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function formatScheduleState(state?: string | null) {
  const map: Record<string, string> = {
    incoming: "Incoming",
    scheduled: "Due today",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    missed: "Missed",
  };
  if (!state) return "Unknown";
  return map[state] ?? state.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scheduleStateClass(state?: string | null) {
  if (state === "incoming") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (state === "scheduled") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (state === "in_progress") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (state === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (state === "cancelled") return "bg-red-50 text-red-700 ring-red-200";
  if (state === "missed") return "bg-orange-50 text-orange-700 ring-orange-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function isWeekRange(range: DriverScheduleRange) {
  return range === "this_week";
}

export function countForFilter(summary: DriverScheduleSummary, filter: DriverScheduleState) {
  if (filter === "all") return summary.total;
  return summary[filter] ?? 0;
}

export function summaryAccent(filter: DriverScheduleState) {
  if (filter === "incoming") return "#0284C7";
  if (filter === "scheduled") return "#D97706";
  if (filter === "in_progress") return "#4F46E5";
  if (filter === "completed") return "#059669";
  if (filter === "missed") return "#EA580C";
  if (filter === "cancelled") return "#DC2626";
  return "#4F5BA9";
}
