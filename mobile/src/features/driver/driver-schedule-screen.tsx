import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons, type IconName } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Card, EmptyState, PrimaryButton, SectionHeader, StatusBadge } from '@/components/ui/primitives';
import { Colors, RoleAccents } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import {
  SCHEDULE_RANGE_OPTIONS,
  SCHEDULE_STATUS_FILTERS,
  countForFilter,
  formatScheduleRangeLabel,
  formatScheduleState,
  isWeekRange,
  scheduleStateTone,
  type DriverScheduleRange,
  type DriverScheduleState,
} from '@/lib/driver-schedule';
import { formatRunDirection, formatTimeRange } from '@/lib/format';
import { fetchDriverSchedule } from '@/lib/mobile-api';
import type { DriverRunItem, DriverScheduleDay } from '@/lib/mobile-types';

function runActionLabel(item: DriverRunItem, isToday: boolean) {
  const state = item.schedule_state ?? item.status;
  if (state === 'in_progress') return 'Continue run';
  if (state === 'completed') return 'View summary';
  if (state === 'cancelled') return 'View details';
  if (state === 'missed') return 'View record';
  if (isToday && state === 'scheduled') return 'Open manifest';
  return 'Preview run';
}

export function DriverScheduleScreen() {
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [range, setRange] = useState<DriverScheduleRange>('this_week');
  const [statusFilter, setStatusFilter] = useState<DriverScheduleState>('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const schedule = useQuery({
    queryKey: ['driver-schedule', range, statusFilter],
    queryFn: () => fetchDriverSchedule({ range, status: statusFilter }),
  });
  const summary = schedule.data?.summary;
  const days = schedule.data?.days ?? [];
  const weekMode = isWeekRange(range);

  const selectedDay = useMemo(
    () =>
      weekMode
        ? days.find((day) => day.date === selectedDate) ??
          days.find((day) => day.is_today) ??
          days.find((day) => day.runs.length > 0) ??
          null
        : null,
    [days, selectedDate, weekMode],
  );

  const rangeLabel = schedule.data ? formatScheduleRangeLabel(schedule.data) : 'Loading range…';
  const visibleRuns = weekMode
    ? selectedDay?.runs ?? []
    : (schedule.data?.runs ?? days.flatMap((day) => day.runs));

  const onRefresh = () => {
    void schedule.refetch();
  };

  const selectRange = (next: DriverScheduleRange) => {
    setRange(next);
    if (next === 'this_week' || next === 'today') {
      setSelectedDate(new Date().toISOString().slice(0, 10));
    }
  };

  const rangeOptions = SCHEDULE_RANGE_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    hint: option.hint,
  }));

  const statusOptions = SCHEDULE_STATUS_FILTERS.map((filter) => ({
    id: filter.id,
    label: filter.label,
    hint: filter.id === 'all' ? 'Every assignment in range' : undefined,
    count: summary ? countForFilter(summary, filter.id) : 0,
  }));

  return (
    <View style={styles.root}>
      <AppHeader title="Schedule" subtitle={rangeLabel} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset + 20 }]}
        refreshControl={
          <RefreshControl refreshing={schedule.isFetching && !schedule.isLoading} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.filtersCard}>
          <View style={styles.filtersRow}>
            <FilterDropdown
              label="Date range"
              value={range}
              options={rangeOptions}
              onChange={selectRange}
              accent={RoleAccents.driver}
            />
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              accent={Colors.primary}
            />
          </View>
          <Text style={styles.metaLine}>
            {visibleRuns.length} shown · {summary?.total ?? 0} total in range
          </Text>
        </Card>

        {schedule.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : weekMode ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
              {days.map((day) => (
                <DayChip
                  key={day.date}
                  day={day}
                  selected={selectedDay?.date === day.date}
                  compact={compact}
                  onPress={() => setSelectedDate(day.date)}
                />
              ))}
            </ScrollView>

            <SectionHeader
              title={selectedDay?.is_today ? 'Today' : selectedDay?.label_long ?? selectedDay?.label ?? 'Selected day'}
              subtitle={
                visibleRuns.length
                  ? `${visibleRuns.length} run${visibleRuns.length === 1 ? '' : 's'} match your filters`
                  : 'No runs match your filters for this day'
              }
            />

            {visibleRuns.length ? (
              visibleRuns.map((item) => (
                <ScheduleRunCard
                  key={item.assignment_id}
                  item={item}
                  isToday={selectedDay?.is_today ?? false}
                  onOpen={() =>
                    router.push({ pathname: '/run/[assignmentId]', params: { assignmentId: item.assignment_id } })
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No matching runs"
                message="Try another day or clear your status filter."
                icon="calendar-clear-outline"
              />
            )}
          </>
        ) : (
          <>
            <SectionHeader
              title="Timeline"
              subtitle={`${visibleRuns.length} run${visibleRuns.length === 1 ? '' : 's'} in ${rangeLabel}`}
            />
            {days.length ? (
              days.map((day) =>
                day.runs.length ? (
                  <View key={day.date} style={styles.timelineSection}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTitle}>{day.label_long ?? day.label}</Text>
                      {day.is_today ? (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillText}>Today</Text>
                        </View>
                      ) : null}
                    </View>
                    {day.runs.map((item) => (
                      <ScheduleRunCard
                        key={item.assignment_id}
                        item={item}
                        isToday={day.is_today}
                        onOpen={() =>
                          router.push({ pathname: '/run/[assignmentId]', params: { assignmentId: item.assignment_id } })
                        }
                      />
                    ))}
                  </View>
                ) : null,
              )
            ) : (
              <EmptyState
                title="No matching runs"
                message="Adjust your date range or status filter to see assignments."
                icon="calendar-outline"
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function summaryAccent(filter: DriverScheduleState) {
  if (filter === 'incoming') return Colors.primary;
  if (filter === 'scheduled') return Colors.warning;
  if (filter === 'in_progress') return Colors.accentDark;
  if (filter === 'completed') return Colors.success;
  if (filter === 'missed') return Colors.orange;
  if (filter === 'cancelled') return Colors.danger;
  return RoleAccents.driver;
}

function DayChip({
  day,
  selected,
  compact,
  onPress,
}: {
  day: DriverScheduleDay;
  selected: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  const weekday = day.label.split(' ')[0] ?? day.weekday.slice(0, 3);
  const dayNum = day.label.split(' ')[1] ?? '';
  const count = day.summary.total;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dayChip,
        compact && styles.dayChipCompact,
        selected && styles.dayChipSelected,
        day.is_today && !selected && styles.dayChipToday,
      ]}
    >
      <Text style={[styles.dayChipWeekday, selected && styles.dayChipTextSelected]}>{weekday}</Text>
      <Text style={[styles.dayChipDate, selected && styles.dayChipTextSelected]}>{dayNum}</Text>
      {count > 0 ? (
        <View style={[styles.dayChipBadge, selected && styles.dayChipBadgeSelected]}>
          <Text style={[styles.dayChipBadgeText, selected && styles.dayChipBadgeTextSelected]}>{count}</Text>
        </View>
      ) : (
        <View style={styles.dayChipSpacer} />
      )}
    </Pressable>
  );
}

function ScheduleRunCard({
  item,
  isToday,
  onOpen,
}: {
  item: DriverRunItem;
  isToday: boolean;
  onOpen: () => void;
}) {
  const state = item.schedule_state ?? item.status;
  const schoolName = item.route?.school?.name ?? 'School not assigned';
  const routeCode = item.route?.code ?? 'Route';
  const direction = formatRunDirection(item.run?.direction);
  const window = formatTimeRange(item.run?.scheduled_start_time, item.run?.scheduled_end_time);
  const bus = item.vehicle?.vehicle_number ?? 'Not assigned';

  return (
    <Card style={styles.runCard}>
      <View style={styles.runHeader}>
        <View style={styles.runTitleBlock}>
          <Text style={styles.runName}>{item.run?.name ?? 'Run assignment'}</Text>
          <View style={styles.schoolRow}>
            <Ionicons name="school-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.schoolName}>{schoolName}</Text>
          </View>
        </View>
        <StatusBadge label={formatScheduleState(state)} tone={scheduleStateTone(state)} />
      </View>

      <View style={styles.routeBadge}>
        <Text style={styles.routeBadgeText}>Route {routeCode}</Text>
        {item.service_date ? <Text style={styles.dateMeta}>{item.service_date}</Text> : null}
      </View>

      <View style={styles.factsGrid}>
        <RunFact icon="time-outline" label="Window" value={window} accent={Colors.primary} />
        <RunFact icon="swap-horizontal-outline" label="Direction" value={direction} accent={RoleAccents.driver} />
        <RunFact icon="bus-outline" label="Bus" value={bus} accent={RoleAccents.driver} />
        <RunFact
          icon="flag-outline"
          label="Status"
          value={formatScheduleState(state)}
          accent={summaryAccent((state as DriverScheduleState) || 'all')}
        />
      </View>

      <PrimaryButton label={runActionLabel(item, isToday)} icon="chevron-forward" onPress={onOpen} />
    </Card>
  );
}

function RunFact({
  icon,
  label,
  value,
  accent,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.factCell}>
      <View style={[styles.factIcon, { backgroundColor: `${accent}12` }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, gap: 14 },
  filtersCard: { gap: 10, padding: 14 },
  filtersRow: { flexDirection: 'row', gap: 10 },
  metaLine: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, paddingTop: 2 },
  dayRow: { gap: 8, paddingVertical: 2 },
  dayChip: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  dayChipCompact: { width: 56, paddingVertical: 8 },
  dayChipSelected: { backgroundColor: RoleAccents.driver, borderColor: RoleAccents.driver },
  dayChipToday: { borderColor: `${RoleAccents.driver}55` },
  dayChipWeekday: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  dayChipDate: { fontSize: 18, fontWeight: '800', color: Colors.label },
  dayChipTextSelected: { color: Colors.white },
  dayChipBadge: {
    marginTop: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${RoleAccents.driver}18`,
  },
  dayChipBadgeSelected: { backgroundColor: 'rgba(255,255,255,0.22)' },
  dayChipBadgeText: { fontSize: 10, fontWeight: '800', color: RoleAccents.driver },
  dayChipBadgeTextSelected: { color: Colors.white },
  dayChipSpacer: { height: 20, marginTop: 4 },
  timelineSection: { gap: 12 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  timelineTitle: { fontSize: 15, fontWeight: '800', color: Colors.label },
  runCard: { gap: 14 },
  runHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  runTitleBlock: { flex: 1, gap: 6 },
  runName: { fontSize: 17, fontWeight: '800', color: Colors.label, letterSpacing: -0.2 },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  schoolName: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  routeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  routeBadgeText: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dateMeta: { fontSize: 12, fontWeight: '600', color: Colors.placeholder },
  todayPill: {
    borderRadius: 999,
    backgroundColor: `${RoleAccents.driver}14`,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayPillText: { fontSize: 11, fontWeight: '700', color: RoleAccents.driver },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  factCell: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  factValue: { fontSize: 13, fontWeight: '700', color: Colors.label, lineHeight: 18 },
});
