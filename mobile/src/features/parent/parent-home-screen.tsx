import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons, type IconName } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { Card, EmptyState, PressableCard, PrimaryButton, SectionHeader, StatusBadge } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { IconListItem } from '@/components/ui/icon-list-item';
import { AppIcon } from '@/components/ui/app-icon';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchMobileNotifications, fetchParentChildren } from '@/lib/mobile-api';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useAuthStore } from '@/store/auth';
import { getMobileRole } from '@/constants/app';
import { getQueryErrorMessage } from '@/lib/query-utils';
import { showConfirmAlert } from '@/store/sweet-alert';

import type { ParentChildItem } from '@/lib/mobile-types';

function childStatus(item: ParentChildItem) {
  const run = item.routes_today.flatMap((r) => r.runs).find((r) => r.assignment?.status === 'in_progress')
    ?? item.routes_today.flatMap((r) => r.runs)[0];
  if (run?.assignment?.status === 'in_progress') return { label: 'On bus', tone: 'success' as const };
  if (run?.assignment) return { label: 'Scheduled', tone: 'info' as const };
  return { label: 'No active run', tone: 'default' as const };
}

export function ParentHomeScreen() {
  const tabBarInset = useTabBarInset();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const mobileRole = getMobileRole(user);
  const router = useRouter();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const refreshLock = useRef(false);
  const notifications = useQuery({
    queryKey: ['mobile-notifications'],
    queryFn: fetchMobileNotifications,
    enabled: !!token && mobileRole === 'parent',
  });
  const children = useQuery({
    queryKey: ['parent-children'],
    queryFn: fetchParentChildren,
    enabled: !!token && mobileRole === 'parent',
  });

  const openChild = (studentId: string) => {
    router.push({ pathname: '/child/[studentId]', params: { studentId } });
  };

  const onRefresh = async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setPullRefreshing(true);
    try {
      await Promise.all([children.refetch(), notifications.refetch()]);
    } finally {
      refreshLock.current = false;
      setPullRefreshing(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title={`Hello, ${user?.first_name ?? 'Parent'}`}
        subtitle="Your children's transportation"
        unread={notifications.data?.unread ?? 0}
        onAlertsPress={() => router.push('/alerts')}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset + 16 }]}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}
      >
        <SectionHeader title="My children" subtitle="Tap a child for details and live status" />

        <View style={styles.quickRow}>
          <QuickChip icon="navigate" label="Track bus" onPress={() => router.push('/track')} />
          <QuickChip icon="chatbubbles" label="Messages" onPress={() => router.push('/messages')} />
          <QuickChip icon="notifications" label="Alerts" onPress={() => router.push('/alerts')} />
          <QuickChip
            icon="call"
            label="Dispatch"
            onPress={() =>
              showConfirmAlert(
                'Contact dispatch?',
                'Call your transportation office for route help.',
                () => Linking.openURL('tel:5550101000'),
                { confirmText: 'Call dispatch' },
              )
            }
          />
        </View>

        {children.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : children.isError ? (
          <EmptyState
            title="Couldn't load children"
            message={getQueryErrorMessage(children.error)}
            icon="cloud-offline-outline"
            accent={Colors.danger}
            actionLabel="Try again"
            onAction={() => void children.refetch()}
          />
        ) : children.data?.length ? (
          children.data.map((item) => {
            const name = `${item.student.first_name} ${item.student.last_name}`;
            const status = childStatus(item);
            const nextRun = item.routes_today.flatMap((r) => r.runs)[0];

            return (
              <PressableCard
                key={item.student.id}
                style={styles.childCard}
                onPress={() => openChild(item.student.id)}
              >
                <View style={styles.childRow}>
                  <PhotoAvatar name={name} size={52} seed={item.student.id} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{name}</Text>
                    <Text style={styles.childMeta}>
                      Grade {item.student.grade} · {item.school?.name ?? 'School'}
                    </Text>
                    <View style={{ marginTop: 8 }}>
                      <StatusBadge label={status.label} tone={status.tone} />
                    </View>
                  </View>
                </View>
                {nextRun ? (
                  <View style={styles.runBox}>
                    <Text style={styles.runLabel}>Next run</Text>
                    <Text style={styles.runText}>
                      {nextRun.name} · {nextRun.scheduled_start_time} · {nextRun.direction.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </PressableCard>
            );
          })
        ) : (
          <EmptyState
            title="No children linked"
            message="Ask your school transportation office to link students to your parent account."
            icon="people-outline"
            accent={RoleAccents.parent}
          />
        )}

        <Pressable
          style={styles.helpCard}
          onPress={() => router.push('/support')}
        >
          <View style={styles.helpHeader}>
            <AppIcon name="headset-outline" size={18} color={Colors.orange} variant="soft" accent={Colors.orange} />
            <Text style={styles.helpTitle}>Need help?</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.orange} style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.helpList}>
            <IconListItem icon="call-outline" label="Contact dispatch for route changes or absence reporting." accent={Colors.orange} />
            <IconListItem icon="notifications-outline" label="Notifications alert you to delays and pickup events." accent={Colors.orange} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function QuickChip({ icon, label, onPress }: { icon: IconName; label: string; onPress?: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={[styles.chipIcon, { backgroundColor: `${RoleAccents.parent}12` }]}>
        <Ionicons name={icon} size={15} color={RoleAccents.parent} />
      </View>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 32, gap: 14 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 11, fontWeight: '700', color: Colors.secondary },
  childCard: { gap: 12 },
  childRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  childName: { fontSize: 17, fontWeight: '700', color: Colors.secondary },
  childMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  runBox: { backgroundColor: Colors.backgroundElement, borderRadius: 14, padding: 12, gap: 4, marginTop: 4 },
  runLabel: { fontSize: 10, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase' },
  runText: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
  helpCard: {
    backgroundColor: Colors.orangeLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${Colors.orange}33`,
    padding: 16,
    gap: 12,
  },
  helpHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  helpTitle: { fontSize: 14, fontWeight: '700', color: Colors.orange },
  helpList: { gap: 10 },
});
