import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/shell/app-header';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Card, EmptyState, StatusBadge } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { fetchMobileNotifications } from '@/lib/mobile-api';
import type { MobileNotification, NotificationSeverity } from '@/lib/mobile-types';
import { showSweetAlert } from '@/store/sweet-alert';

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
  const notifications = useQuery({ queryKey: ['mobile-notifications'], queryFn: fetchMobileNotifications });
  const unread = notifications.data?.unread ?? 0;

  return (
    <View style={styles.root}>
      <AppHeader title="Alerts" subtitle={`${unread} unread notification${unread === 1 ? '' : 's'}`} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={notifications.isFetching} onRefresh={() => notifications.refetch()} />}
      >
        {notifications.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : notifications.data?.items.length ? (
          notifications.data.items.map((item) => (
            <AlertCard key={item.id} item={item} />
          ))
        ) : (
          <EmptyState title="All caught up" message="You have no notifications right now." icon="checkmark-done-outline" accent={Colors.success} />
        )}
      </ScrollView>
    </View>
  );
}

function AlertCard({ item }: { item: MobileNotification }) {
  const accent = categoryColor(item.category);
  return (
    <Pressable
      onPress={() =>
        showSweetAlert({
          type: item.severity === 'warning' ? 'warning' : item.severity === 'danger' ? 'error' : 'info',
          title: item.title,
          message: `${item.message}\n\n${new Date(item.time).toLocaleString()}`,
        })
      }
    >
      <Card style={[styles.card, !item.read && styles.unread]}>
        <View style={styles.top}>
          <AppIcon name={categoryIcon(item.category)} size={17} color={accent} variant="soft" accent={accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.category}>{item.category.replace('_', ' ')}</Text>
          </View>
          <StatusBadge label={item.severity} tone={severityTone(item.severity)} />
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.tapHint}>Tap for details</Text>
        <Text style={styles.time}>{new Date(item.time).toLocaleString()}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 32, gap: 12 },
  card: { gap: 8 },
  unread: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  category: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  message: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  tapHint: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  time: { fontSize: 11, color: Colors.placeholder },
});
