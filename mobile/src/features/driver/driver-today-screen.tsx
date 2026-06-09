import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons, type IconName } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { Card, EmptyState, PrimaryButton, SectionHeader, StatusBadge } from '@/components/ui/primitives';
import { IconListItem } from '@/components/ui/icon-list-item';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchChatConversations } from '@/lib/chat-api';
import { formatRunDirection, formatRunStatus, formatTime } from '@/lib/format';
import { fetchDriverToday, fetchMobileNotifications } from '@/lib/mobile-api';
import type { DriverTodayPayload } from '@/lib/mobile-types';
import { useAuthStore } from '@/store/auth';

type RunItem = DriverTodayPayload['runs'][number];

function runStatusTone(status: string) {
  if (status === 'in_progress') return 'info' as const;
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  return 'default' as const;
}

function runActionLabel(status: string) {
  if (status === 'in_progress') return 'Continue run';
  if (status === 'completed') return 'View summary';
  return 'View details';
}

function runActionIcon(): IconName {
  return 'chevron-forward';
}

export function DriverTodayScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const notifications = useQuery({ queryKey: ['mobile-notifications'], queryFn: fetchMobileNotifications });
  const chat = useQuery({ queryKey: ['chat-conversations'], queryFn: fetchChatConversations });
  const today = useQuery({ queryKey: ['driver-today'], queryFn: fetchDriverToday });

  const unread = notifications.data?.unread ?? 0;
  const unreadMessages = chat.data?.unread_total ?? 0;
  const summary = today.data?.summary;

  const openRun = (assignmentId: string) => {
    router.push({ pathname: '/run/[assignmentId]', params: { assignmentId } });
  };

  const onRefresh = () => {
    void today.refetch();
    void notifications.refetch();
    void chat.refetch();
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title={`Good day, ${user?.first_name ?? 'Driver'}`}
        subtitle="Today's assignments"
        unread={unread}
        onAlertsPress={() => router.push('/alerts')}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={today.isFetching && !today.isLoading} onRefresh={onRefresh} />}
      >
        <View style={styles.hubRow}>
          <HubTile
            icon="chatbubbles-outline"
            label="Messages"
            badge={unreadMessages}
            accent={Colors.primary}
            onPress={() => router.push('/messages')}
          />
          <HubTile
            icon="headset-outline"
            label="Support"
            accent={RoleAccents.driver}
            onPress={() => router.push('/support')}
          />
          <HubTile
            icon="calendar-outline"
            label="Schedule"
            accent={Colors.accentDark}
            onPress={() => router.push('/schedule')}
          />
          <HubTile
            icon="person-outline"
            label="Profile"
            accent={Colors.secondary}
            onPress={() => router.push('/profile')}
          />
        </View>

        <View style={styles.summaryRow}>
          <SummaryTile label="Total" value={summary?.total ?? 0} accent={Colors.primary} />
          <SummaryTile label="Active" value={summary?.in_progress ?? 0} accent={RoleAccents.driver} />
          <SummaryTile label="Done" value={summary?.completed ?? 0} accent={Colors.success} />
        </View>

        <SectionHeader
          title="Today's runs"
          subtitle={
            summary?.total
              ? `${summary.total} assignment${summary.total === 1 ? '' : 's'} · tap View details to open manifest`
              : 'Pull down to refresh your schedule'
          }
        />

        {today.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : today.data?.runs.length ? (
          today.data.runs.map((item) => (
            <RunCard key={item.assignment_id} item={item} onOpen={() => openRun(item.assignment_id)} />
          ))
        ) : (
          <EmptyState
            title="No runs scheduled"
            message="You have no assignments for today. Contact dispatch if this looks wrong."
            icon="calendar-outline"
          />
        )}

        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>Driver toolkit</Text>
          <View style={styles.tipList}>
            <Pressable onPress={() => router.push('/messages')}>
              <IconListItem
                icon="chatbubbles-outline"
                label={
                  unreadMessages > 0
                    ? `Message dispatch (${unreadMessages} unread)`
                    : 'Message dispatch for route changes or delays'
                }
                accent={Colors.primary}
              />
            </Pressable>
            <Pressable onPress={() => router.push('/support')}>
              <IconListItem icon="help-buoy-outline" label="Support center, FAQs & emergency contacts" accent={RoleAccents.driver} />
            </Pressable>
            <IconListItem icon="people-outline" label="Mark student boardings from the run manifest" accent={Colors.primary} />
            <IconListItem icon="navigate-outline" label="GPS starts automatically when you begin a run" accent={Colors.primary} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function RunCard({ item, onOpen }: { item: RunItem; onOpen: () => void }) {
  const status = item.status;
  const schoolName = item.route?.school?.name ?? 'School not assigned';
  const routeCode = item.route?.code ?? 'Route';
  const direction = formatRunDirection(item.run?.direction);
  const departTime = formatTime(item.run?.scheduled_start_time);
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
        <StatusBadge label={formatRunStatus(status)} tone={runStatusTone(status)} />
      </View>

      <View style={styles.routeBadge}>
        <Text style={styles.routeBadgeText}>Route {routeCode}</Text>
      </View>

      <View style={styles.factsGrid}>
        <RunFact icon="time-outline" label="Departure" value={departTime} accent={Colors.primary} />
        <RunFact icon="swap-horizontal-outline" label="Direction" value={direction} accent={RoleAccents.driver} />
        <RunFact icon="bus-outline" label="Bus" value={bus} accent={Colors.secondary} />
      </View>

      <PrimaryButton
        label={runActionLabel(status)}
        icon={runActionIcon()}
        onPress={onOpen}
      />
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
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={[styles.summaryTile, { borderTopColor: accent }]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function HubTile({
  icon,
  label,
  badge,
  accent,
  onPress,
}: {
  icon: IconName;
  label: string;
  badge?: number;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.hubTile} onPress={onPress}>
      <View style={[styles.hubIcon, { backgroundColor: `${accent}14` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.hubLabel}>{label}</Text>
      {badge && badge > 0 ? (
        <View style={styles.hubBadge}>
          <Text style={styles.hubBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 32, gap: 14 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  hubRow: { flexDirection: 'row', gap: 8 },
  hubTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  hubIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hubLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  hubBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  hubBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  summaryTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
  },
  summaryValue: { fontSize: 24, fontWeight: '800', color: Colors.secondary },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  runCard: { gap: 14 },
  runHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  runTitleBlock: { flex: 1, gap: 6 },
  runName: { fontSize: 18, fontWeight: '800', color: Colors.secondary, letterSpacing: -0.2 },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  schoolName: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  routeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundElement,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  factsGrid: { flexDirection: 'row', gap: 8 },
  factCell: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  factIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factLabel: { fontSize: 10, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase', letterSpacing: 0.4 },
  factValue: { fontSize: 14, fontWeight: '700', color: Colors.secondary, lineHeight: 18 },
  tipCard: { backgroundColor: Colors.primaryLight, borderColor: `${Colors.primary}22`, gap: 10 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tipList: { gap: 10 },
});
