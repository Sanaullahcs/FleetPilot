import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { ParentTrackingMap } from '@/components/maps/parent-tracking-map';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { formatTime } from '@/lib/format';
import { getMapModeLabel } from '@/lib/map-config';
import { fetchParentTracking } from '@/lib/mobile-api';
import { showConfirmAlert, showSweetAlert } from '@/store/sweet-alert';

export function ParentTrackMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const pad = Math.max(16, Math.min(24, width * 0.048));
  const [bottomCardHeight, setBottomCardHeight] = useState(260);
  const zoomControlsBottom = bottomCardHeight + Math.max(insets.bottom, 20) + 16;

  const tracking = useQuery({
    queryKey: ['parent-tracking'],
    queryFn: fetchParentTracking,
    refetchInterval: 15_000,
  });

  const tracks = tracking.data?.tracks ?? [];
  const focusTrack =
    tracks.find((t) => t.student_id === studentId) ??
    tracks.find((t) => t.tracking_status === 'in_progress') ??
    tracks[0] ??
    null;

  const vehicle = focusTrack?.vehicle;
  const live = focusTrack?.tracking_status === 'in_progress';
  const mapModeLabel = getMapModeLabel();

  const callDriver = () => {
    const phone = vehicle?.driver?.phone;
    if (!phone) {
      showSweetAlert({ type: 'info', title: 'No driver phone', message: 'Driver contact is not available.' });
      return;
    }
    showConfirmAlert('Call driver?', phone, () => {
      Linking.openURL(`tel:${phone.replace(/\D/g, '')}`).catch(() => {
        showSweetAlert({ type: 'error', title: 'Call failed', message: 'Unable to open the phone dialer.' });
      });
    }, { confirmText: 'Call now' });
  };

  return (
    <View style={styles.root}>
      <ParentTrackingMap
        tracks={tracks}
        center={tracking.data?.center}
        focusTrack={focusTrack}
        fullScreen
        hideOverlay
        zoomControlsBottom={zoomControlsBottom}
      />

      <View style={[styles.header, { paddingTop: insets.top + 14, paddingHorizontal: pad }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.glassBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Live map</Text>
            {mapModeLabel ? <Text style={styles.headerSub}>{mapModeLabel}</Text> : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {tracks.length > 1 ? (
          <View style={styles.segment}>
            {tracks.map((t) => {
              const on = t.student_id === focusTrack?.student_id;
              return (
                <Pressable
                  key={t.student_id}
                  style={[styles.segmentItem, on && styles.segmentItemOn]}
                  onPress={() => router.setParams({ studentId: t.student_id })}
                >
                  <Text style={[styles.segmentText, on && styles.segmentTextOn]} numberOfLines={1}>
                    {t.student_name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : focusTrack ? (
          <View style={styles.singleName}>
            <Text style={styles.singleNameText} numberOfLines={1}>
              {focusTrack.student_name}
            </Text>
          </View>
        ) : null}
      </View>

      {focusTrack ? (
        <View
          style={[styles.card, { marginHorizontal: pad, marginBottom: Math.max(insets.bottom, 20) }]}
          onLayout={(event) => setBottomCardHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.studentName} numberOfLines={1}>{focusTrack.student_name}</Text>
              <Text style={styles.school} numberOfLines={1}>{focusTrack.school?.name}</Text>
              <View style={styles.liveRow}>
                {live ? <View style={styles.liveDot} /> : null}
                <Text style={styles.liveLabel}>{live ? 'Live on route' : 'Scheduled'}</Text>
              </View>
            </View>
            {vehicle ? (
              <View style={styles.speedHero}>
                <Text style={styles.speedValue}>{Math.round(vehicle.speed_mph)}</Text>
                <Text style={styles.speedUnit}>mph</Text>
              </View>
            ) : null}
          </View>

          {vehicle ? (
            <View style={styles.stats}>
              <Stat label="Bus" value={`#${vehicle.vehicle_number}`} />
              <View style={styles.statLine} />
              <Stat label="Heading" value={`${Math.round(vehicle.heading)}°`} />
              {focusTrack.run ? (
                <>
                  <View style={styles.statLine} />
                  <Stat label="Pickup" value={formatTime(focusTrack.run.scheduled_start_time)} />
                </>
              ) : null}
            </View>
          ) : (
            <Text style={styles.empty}>No bus assigned yet</Text>
          )}

          {vehicle?.driver ? (
            <View style={styles.driver}>
              <PhotoAvatar
                name={`${vehicle.driver.first_name} ${vehicle.driver.last_name}`}
                size={40}
                seed={vehicle.driver.phone}
              />
              <View style={styles.driverBody}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {vehicle.driver.first_name} {vehicle.driver.last_name}
                </Text>
                <Text style={styles.driverMeta}>Assigned driver</Text>
              </View>
              <Pressable style={styles.callBtn} onPress={callDriver}>
                <Ionicons name="call" size={18} color={Colors.white} />
              </Pressable>
            </View>
          ) : null}

          {tracking.data?.updated_at ? (
            <Text style={styles.updated}>
              Updated {new Date(tracking.data.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          ) : null}

          {tracking.isFetching ? (
            <ActivityIndicator size="small" color={RoleAccents.parent} style={styles.loader} />
          ) : null}
        </View>
      ) : tracking.isLoading ? (
        <View style={[styles.card, styles.cardLoading, { marginHorizontal: pad, marginBottom: insets.bottom + 20 }]}>
          <ActivityIndicator color={RoleAccents.parent} />
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const glass = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.7)',
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#D8E4EF' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.secondary },
  headerSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  headerSpacer: { width: 44 },
  glassBtn: {
    ...glass,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    ...glass,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  singleName: {
    ...glass,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  singleNameText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentItemOn: { backgroundColor: RoleAccents.parent },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  segmentTextOn: { fontSize: 14, fontWeight: '700', color: Colors.white },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...glass,
    borderRadius: 22,
    padding: 20,
    gap: 16,
  },
  cardLoading: { alignItems: 'center', paddingVertical: 28 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  cardInfo: { flex: 1, minWidth: 0, gap: 2 },
  studentName: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  school: { fontSize: 13, color: Colors.textMuted },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  speedHero: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  speedValue: { fontSize: 36, fontWeight: '800', color: Colors.secondary, letterSpacing: -1 },
  speedUnit: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, gap: 3 },
  statLine: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: 10 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.placeholder, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  driver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  driverBody: { flex: 1, gap: 2 },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  driverMeta: { fontSize: 12, color: Colors.textMuted },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: RoleAccents.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updated: { fontSize: 11, color: Colors.placeholder, textAlign: 'center' },
  empty: { fontSize: 14, color: Colors.textMuted },
  loader: { position: 'absolute', top: 16, right: 16 },
});
