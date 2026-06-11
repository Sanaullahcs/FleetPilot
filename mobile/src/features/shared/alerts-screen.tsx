import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '@/components/shell/app-header';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Card, EmptyState, StatusBadge } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { fetchMobileNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/mobile-api';
import type { MobileNotification, NotificationSeverity } from '@/lib/mobile-types';

function severityTone(severity: NotificationSeverity) {
  if (severity === 'success') return 'success' as const;
  if (severity === 'warning') return 'warning' as const;
  if (severity === 'danger') return 'danger' as const;
  return 'info' as const;
}

function categoryIcon(category: string): AppIconName {
  if (category === 'assignment' || category === 'schedule') return 'calendar';
  if (category === 'compliance') return 'shield-checkmark';
  if (category === 'tracking') return 'navigate';
  if (category === 'student') return 'school';
  if (category === 'account') return 'person';
  return 'notifications';
}

function categoryColor(category: string) {
  if (category === 'compliance') return Colors.warning;
  if (category === 'tracking') return Colors.success;
  if (category === 'assignment') return Colors.primary;
  return Colors.accent;
}

export function AlertsScreen() {
  const queryClient = useQueryClient();
  const tabBarInset = useTabBarInset();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const refreshLock = useRef(false);
  const notifications = useQuery({ queryKey: ['mobile-notifications'], queryFn: fetchMobileNotifications });
  const unread = notifications.data?.unread ?? 0;

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      setExpandedId(null);
      void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      setExpandedId(null);
      void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
    },
  });

  const onRefresh = async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setPullRefreshing(true);
    try {
      await notifications.refetch();
    } finally {
      refreshLock.current = false;
      setPullRefreshing(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Alerts"
        subtitle={unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'All caught up'}
      />
      {unread > 0 ? (
        <View style={styles.toolbar}>
          <Pressable style={styles.markAllBtn} onPress={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset + 16 }]}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}
      >
        {notifications.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : notifications.data?.items.length ? (
          notifications.data.items.map((item) => (
            <AlertCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              dismissing={markReadMutation.isPending && markReadMutation.variables === item.id}
              onPress={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
              onDismiss={() => markReadMutation.mutate(item.id)}
            />
          ))
        ) : (
          <EmptyState title="All caught up" message="You have no new notifications." icon="checkmark-done-outline" accent={Colors.success} />
        )}
      </ScrollView>
    </View>
  );
}

function AlertCard({
  item,
  expanded,
  dismissing,
  onPress,
  onDismiss,
}: {
  item: MobileNotification;
  expanded: boolean;
  dismissing: boolean;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const accent = categoryColor(item.category);
  return (
    <Card style={[styles.card, styles.unread]}>
      <Pressable onPress={onPress}>
        <View style={styles.top}>
          <AppIcon name={categoryIcon(item.category)} size={17} color={accent} variant="soft" accent={accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.category}>{item.category.replace('_', ' ')}</Text>
          </View>
          <StatusBadge label={item.severity} tone={severityTone(item.severity)} />
        </View>
        <Text style={styles.message} numberOfLines={expanded ? undefined : 2}>
          {item.message}
        </Text>
        {!expanded ? <Text style={styles.tapHint}>Tap to read · swipe down to refresh</Text> : null}
      </Pressable>
      {expanded ? (
        <>
          <Text style={styles.time}>{new Date(item.time).toLocaleString()}</Text>
          <Pressable style={styles.dismissBtn} onPress={onDismiss} disabled={dismissing}>
            <Text style={styles.dismissText}>{dismissing ? 'Removing…' : 'Mark as read'}</Text>
          </Pressable>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  toolbar: { paddingHorizontal: 18, paddingBottom: 4 },
  markAllBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 },
  markAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  scroll: { padding: 18, gap: 12 },
  card: { gap: 8 },
  unread: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  category: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  message: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  tapHint: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  time: { fontSize: 11, color: Colors.placeholder },
  dismissBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dismissText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
});
