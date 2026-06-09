/** Human-readable labels for driver run data. */

export function formatRunDirection(direction?: string | null): string {
  if (!direction) return '—';
  const map: Record<string, string> = {
    to_school: 'To school',
    from_school: 'From school',
    midday: 'Midday',
    field_trip: 'Field trip',
  };
  return map[direction.toLowerCase()] ?? direction.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRunStatus(status?: string | null): string {
  if (!status) return 'Unknown';
  const map: Record<string, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "07:00:00" or "07:00" → "7:00 AM" */
export function formatTime(value?: string | null): string {
  if (!value) return '—';
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  let hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${period}`;
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '—';
  if (start && end) return `${formatTime(start)} – ${formatTime(end)}`;
  return formatTime(start ?? end);
}
