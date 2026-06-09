import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/shell/app-header';
import { EmptyState, PressableCard, SectionHeader, StatusBadge } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { formatRunDirection, formatRunStatus, formatTimeRange } from '@/lib/format';
import { fetchDriverToday } from '@/lib/mobile-api';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DriverScheduleScreen() {
  const router = useRouter();
  const today = useQuery({ queryKey: ['driver-today'], queryFn: fetchDriverToday });
  const dayIndex = new Date().getDay();
  const activeDay = dayIndex === 0 ? 6 : dayIndex - 1;

  return (
    <View style={styles.root}>
      <AppHeader title="Schedule" subtitle="Upcoming assignments" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((d, i) => (
            <View key={d} style={[styles.dayChip, i === activeDay && styles.dayChipActive]}>
              <Text style={[styles.dayChipText, i === activeDay && styles.dayChipTextActive]}>{d}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="This week" subtitle="Tap a run to open the manifest" />

        {today.data?.runs.length ? (
          today.data.runs.map((item) => (
            <PressableCard
              key={item.assignment_id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/run/[assignmentId]', params: { assignmentId: item.assignment_id } })
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.title}>{item.run?.name}</Text>
                <StatusBadge label={formatRunStatus(item.status)} tone="driver" />
              </View>
              <Text style={styles.meta}>
                {formatTimeRange(item.run?.scheduled_start_time, item.run?.scheduled_end_time)} ·{' '}
                {formatRunDirection(item.run?.direction)}
              </Text>
              <Text style={styles.school}>{item.route?.school?.name}</Text>
            </PressableCard>
          ))
        ) : (
          <EmptyState title="Nothing scheduled" message="Your weekly schedule will appear here once runs are assigned." icon="calendar-clear-outline" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 32, gap: 14 },
  weekRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dayChipTextActive: { color: Colors.white },
  card: { gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '700', color: Colors.secondary, flex: 1 },
  meta: { fontSize: 13, color: Colors.textSecondary },
  school: { fontSize: 12, color: Colors.textMuted },
});
