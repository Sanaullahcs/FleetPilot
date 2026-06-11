import type { DriverRunItem, DriverScheduleDay, DriverSchedulePayload, DriverScheduleSummary } from '@/lib/mobile-types';

export type DriverScheduleRange =
  | 'today'
  | 'this_week'
  | 'last_7'
  | 'last_14'
  | 'last_30'
  | 'next_7'
  | 'next_14'
  | 'next_30'
  | 'rolling_60'
  | 'custom';

export type DriverScheduleState =
  | 'all'
  | 'incoming'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'missed';

export const SCHEDULE_RANGE_OPTIONS: Array<{ id: DriverScheduleRange; label: string; hint: string }> = [
  { id: 'today', label: 'Today', hint: 'Current day only' },
  { id: 'this_week', label: 'This week', hint: 'Mon – Sun' },
  { id: 'last_7', label: 'Last 7 days', hint: 'Recent history' },
  { id: 'last_14', label: 'Last 14 days', hint: 'Two-week history' },
  { id: 'last_30', label: 'Last 30 days', hint: 'Monthly history' },
  { id: 'next_7', label: 'Next 7 days', hint: 'Upcoming week' },
  { id: 'next_14', label: 'Next 14 days', hint: 'Two weeks ahead' },
  { id: 'next_30', label: 'Next 30 days', hint: 'Monthly upcoming' },
  { id: 'rolling_60', label: '±30 days', hint: 'Past & future window' },
];

export const SCHEDULE_STATUS_FILTERS: Array<{
  id: DriverScheduleState;
  label: string;
  summaryKey?: keyof DriverScheduleSummary;
}> = [
  { id: 'all', label: 'All statuses', summaryKey: 'total' },
  { id: 'incoming', label: 'Incoming', summaryKey: 'incoming' },
  { id: 'scheduled', label: 'Due today', summaryKey: 'scheduled' },
  { id: 'in_progress', label: 'In progress', summaryKey: 'in_progress' },
  { id: 'completed', label: 'Completed', summaryKey: 'completed' },
  { id: 'missed', label: 'Missed', summaryKey: 'missed' },
  { id: 'cancelled', label: 'Cancelled', summaryKey: 'cancelled' },
];

export function getRangeOptionLabel(range: DriverScheduleRange) {
  return SCHEDULE_RANGE_OPTIONS.find((o) => o.id === range)?.label ?? 'Custom range';
}

export function getStatusOptionLabel(status: DriverScheduleState) {
  return SCHEDULE_STATUS_FILTERS.find((o) => o.id === status)?.label ?? 'All statuses';
}

export function formatScheduleRangeLabel(data: Pick<DriverSchedulePayload, 'range' | 'range_start' | 'range_end'>) {
  const start = new Date(`${data.range_start}T12:00:00`);
  const end = new Date(`${data.range_end}T12:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (data.range_start === data.range_end) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function formatScheduleState(state?: string | null): string {
  const map: Record<string, string> = {
    incoming: 'Incoming',
    scheduled: 'Due today',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    missed: 'Missed',
  };
  if (!state) return 'Unknown';
  return map[state] ?? state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scheduleStateTone(state?: string | null) {
  if (state === 'incoming') return 'info' as const;
  if (state === 'scheduled') return 'warning' as const;
  if (state === 'in_progress') return 'info' as const;
  if (state === 'completed') return 'success' as const;
  if (state === 'cancelled') return 'danger' as const;
  if (state === 'missed') return 'danger' as const;
  return 'default' as const;
}

export function isWeekRange(range: DriverScheduleRange) {
  return range === 'this_week';
}

export function countForFilter(summary: DriverScheduleSummary, filter: DriverScheduleState) {
  if (filter === 'all') return summary.total;
  return summary[filter] ?? 0;
}

export function runsForSelectedDay(day: DriverScheduleDay | null, allRuns: DriverRunItem[]) {
  if (day) return day.runs;
  return allRuns;
}
