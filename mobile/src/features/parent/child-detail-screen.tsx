import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/shell/app-header';
import { ParentLiveMap } from '@/components/maps/parent-live-map';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchParentChildren, fetchParentTracking } from '@/lib/mobile-api';
import { showConfirmAlert, showSweetAlert } from '@/store/sweet-alert';

export function ChildDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pad = Math.max(16, Math.min(22, width * 0.05));
  const mapH = Math.min(Math.round(width * 0.4), 200);

  const children = useQuery({ queryKey: ['parent-children'], queryFn: fetchParentChildren });
  const tracking = useQuery({ queryKey: ['parent-tracking'], queryFn: fetchParentTracking, refetchInterval: 30_000 });

  const child = children.data?.find((c) => c.student.id === studentId);
  const track = tracking.data?.tracks.find((t) => t.student_id === studentId);
  const name = child ? `${child.student.first_name} ${child.student.last_name}` : 'Student';
  const vehicle = track?.vehicle;
  const nextRun = child?.routes_today.flatMap((r) => r.runs)[0];
  const live = track?.tracking_status === 'in_progress';

  const openFullMap = () => router.push({ pathname: '/track-map', params: { studentId: child!.student.id } });

  const callDriver = () => {
    const phone = track?.vehicle?.driver?.phone ?? child?.assigned_driver?.phone;
    if (!phone) {
      showSweetAlert({ type: 'info', title: 'No driver phone', message: 'Driver contact is not available for this run.' });
      return;
    }
    showConfirmAlert('Call driver?', phone, () => {
      Linking.openURL(`tel:${phone.replace(/\D/g, '')}`).catch(() => {
        showSweetAlert({ type: 'error', title: 'Call failed', message: 'Unable to open the phone dialer.' });
      });
    }, { confirmText: 'Call now' });
  };

  if (children.isLoading) {
    return (
      <View style={styles.root}>
        <AppHeader title="Student" subtitle="Loading…" onBackPress={() => router.back()} />
        <ActivityIndicator color={RoleAccents.parent} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.root}>
        <AppHeader title="Student" subtitle="Not found" onBackPress={() => router.back()} />
        <Text style={[styles.body, { margin: pad }]}>This student could not be loaded.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader title={name} subtitle={child.school?.name ?? 'Profile'} onBackPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: pad, paddingBottom: Math.max(insets.bottom, 20) + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <PhotoAvatar name={name} size={56} seed={child.student.id} />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{name}</Text>
            <Text style={styles.heroMeta}>Grade {child.student.grade}</Text>
            {live ? (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>On route now</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.mapWrap}>
          <ParentLiveMap tracks={track ? [track] : []} focusTrack={track ?? null} height={mapH} onExpand={openFullMap} />
        </View>

        <View style={styles.actions}>
          <IconAction icon="map-outline" label="Map" onPress={openFullMap} />
          <IconAction icon="call-outline" label="Call" onPress={callDriver} />
          <IconAction icon="chatbubbles-outline" label="Chat" onPress={() => router.push('/messages')} />
          <IconAction
            icon="calendar-outline"
            label="Absence"
            onPress={() =>
              showConfirmAlert(
                'Report absence?',
                'Dispatch will be notified that your child will not ride today.',
                () => showSweetAlert({ type: 'success', title: 'Absence reported', message: 'Dispatch has been notified.' }),
                { confirmText: 'Report' },
              )
            }
          />
        </View>

        {vehicle ? (
          <View style={styles.info}>
            <Text style={styles.infoLine}>
              Bus #{vehicle.vehicle_number} · {Math.round(vehicle.speed_mph)} mph
            </Text>
            {vehicle.driver ? (
              <Text style={styles.infoSub}>
                Driver {vehicle.driver.first_name} {vehicle.driver.last_name}
              </Text>
            ) : null}
          </View>
        ) : null}

        {nextRun ? (
          <View style={styles.info}>
            <Text style={styles.infoLabel}>Today</Text>
            <Text style={styles.infoLine}>
              {nextRun.scheduled_start_time} – {nextRun.scheduled_end_time} · {nextRun.name}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function IconAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={RoleAccents.parent} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { paddingTop: 12, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroText: { flex: 1, gap: 2 },
  heroName: { fontSize: 20, fontWeight: '800', color: Colors.secondary },
  heroMeta: { fontSize: 14, color: Colors.textMuted },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { fontSize: 12, fontWeight: '600', color: Colors.success },
  mapWrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: 6, minWidth: 64 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  info: { gap: 4, paddingVertical: 4 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase' },
  infoLine: { fontSize: 15, fontWeight: '600', color: Colors.secondary, lineHeight: 22 },
  infoSub: { fontSize: 13, color: Colors.textMuted },
  body: { fontSize: 14, color: Colors.textSecondary },
});
