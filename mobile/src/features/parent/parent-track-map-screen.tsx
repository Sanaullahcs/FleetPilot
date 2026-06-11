import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { ParentLiveMap } from '@/components/maps/parent-live-map';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchParentTracking } from '@/lib/mobile-api';

export function ParentTrackMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const pad = Math.max(16, width * 0.05);

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

  return (
    <View style={styles.root}>
      <ParentLiveMap
        tracks={tracks}
        center={tracking.data?.center}
        focusTrack={focusTrack}
        fullScreen
        hideOverlay
      />

      {/* Floating chrome */}
      <View style={[styles.top, { paddingTop: insets.top + 8, paddingHorizontal: pad }]}>
        <Pressable style={styles.glassBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
        </Pressable>

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
        ) : (
          <View style={styles.segmentSingle}>
            <Text style={styles.segmentSingleText} numberOfLines={1}>
              {focusTrack?.student_name ?? 'Live map'}
            </Text>
          </View>
        )}
      </View>

      {/* Floating info card */}
      {focusTrack ? (
        <View style={[styles.card, { marginHorizontal: pad, marginBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
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
                  <Stat label="Pickup" value={focusTrack.run.scheduled_start_time} />
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
                size={32}
                seed={vehicle.driver.phone}
              />
              <Text style={styles.driverName} numberOfLines={1}>
                {vehicle.driver.first_name} {vehicle.driver.last_name}
              </Text>
            </View>
          ) : null}

          {tracking.data?.updated_at ? (
            <Text style={styles.updated}>
              {new Date(tracking.data.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          ) : null}

          {tracking.isFetching ? (
            <ActivityIndicator size="small" color={RoleAccents.parent} style={styles.loader} />
          ) : null}
        </View>
      ) : tracking.isLoading ? (
        <View style={[styles.card, styles.cardLoading, { marginHorizontal: pad, marginBottom: insets.bottom + 16 }]}>
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
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8EEF8' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassBtn: {
    ...glass,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    ...glass,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentSingle: {
    flex: 1,
    ...glass,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentItemOn: { backgroundColor: RoleAccents.parent },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  segmentTextOn: { fontSize: 14, fontWeight: '700', color: Colors.white },
  segmentSingleText: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...glass,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  cardLoading: { alignItems: 'center', paddingVertical: 28 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  school: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  speedHero: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  speedValue: { fontSize: 36, fontWeight: '800', color: Colors.secondary, letterSpacing: -1 },
  speedUnit: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, gap: 2 },
  statLine: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: 8 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.placeholder, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  driver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  driverName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  updated: { fontSize: 11, color: Colors.placeholder, textAlign: 'center' },
  empty: { fontSize: 14, color: Colors.textMuted },
  loader: { position: 'absolute', top: 14, right: 14 },
});
