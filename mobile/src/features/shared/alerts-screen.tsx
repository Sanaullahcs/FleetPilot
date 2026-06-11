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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['mobile-notifications'] });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchMobileNotifications>>>([
        'mobile-notifications',
      ]);
      if (previous) {
        const wasUnread = previous.items.some((item) => item.id === id && !item.read);
        queryClient.setQueryData(['mobile-notifications'], {
          ...previous,
          items: previous.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
          unread: wasUnread ? Math.max(0, previous.unread - 1) : previous.unread,
        });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['mobile-notifications'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['mobile-notifications'] });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof fetchMobileNotifications>>>([
        'mobile-notifications',
      ]);
      if (previous) {
        queryClient.setQueryData(['mobile-notifications'], {
          ...previous,
          items: previous.items.map((item) => ({ ...item, read: true })),
          unread: 0,
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['mobile-notifications'], context.previous);
      }
    },
    onSettled: () => {
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
          [...notifications.data.items]
            .sort((a, b) => Number(a.read) - Number(b.read))
            .map((item) => (
              <AlertCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                markingRead={markReadMutation.isPending && markReadMutation.variables === item.id}
                onPress={() => {
                  const opening = expandedId !== item.id;
                  setExpandedId(opening ? item.id : null);
                  if (opening && !item.read) {
                    markReadMutation.mutate(item.id);
                  }
                }}
              />
            ))
        ) : (
          <EmptyState
            title="No notifications yet"
            message="Route changes, delays, and messages will show up here."
            icon="checkmark-done-outline"
            accent={Colors.success}
          />
        )}
      </ScrollView>
    </View>
  );
}

function AlertCard({
  item,
  expanded,
  markingRead,
  onPress,
}: {
  item: MobileNotification;
  expanded: boolean;
  markingRead: boolean;
  onPress: () => void;
}) {
  const accent = categoryColor(item.category);
  const isUnread = !item.read;
  return (
    <Card style={[styles.card, isUnread ? styles.unread : styles.read]}>
      <Pressable onPress={onPress}>
        <View style={styles.top}>
          <AppIcon name={categoryIcon(item.category)} size={17} color={accent} variant="soft" accent={accent} />
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              {isUnread ? <View style={styles.unreadDot} /> : null}
              <Text style={[styles.title, !isUnread && styles.titleRead]}>{item.title}</Text>
              {!isUnread ? (
                <View style={styles.readBadge}>
                  <Text style={styles.readBadgeText}>Read</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.category}>{item.category.replace('_', ' ')}</Text>
          </View>
          <StatusBadge label={item.severity} tone={severityTone(item.severity)} />
        </View>
        <Text style={[styles.message, !isUnread && styles.messageRead]} numberOfLines={expanded ? undefined : 2}>
          {item.message}
        </Text>
        {!expanded ? (
          <Text style={styles.tapHint}>
            {isUnread ? 'Tap to open and mark as read' : 'Tap to expand · swipe down to refresh'}
          </Text>
        ) : null}
      </Pressable>
      {expanded ? (
        <>
          <Text style={styles.time}>{new Date(item.time).toLocaleString()}</Text>
          {markingRead ? <Text style={styles.markingText}>Marking as read…</Text> : null}
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
  read: { borderColor: Colors.border, backgroundColor: Colors.white, opacity: 0.95 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  title: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: Colors.secondary },
  titleRead: { fontWeight: '600', color: Colors.textSecondary },
  readBadge: {
    borderRadius: 999,
    backgroundColor: Colors.backgroundElement,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  readBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  category: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  message: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  messageRead: { color: Colors.textMuted },
  tapHint: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  time: { fontSize: 11, color: Colors.placeholder },
  markingText: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
