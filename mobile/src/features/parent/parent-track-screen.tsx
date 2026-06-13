import { useMemo, useRef, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { ParentTrackingMap } from '@/components/maps/parent-tracking-map';
import { EmptyState } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { fetchParentTracking } from '@/lib/mobile-api';
import type { ParentTrackItem } from '@/lib/mobile-types';

export function ParentTrackScreen() {
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { width, height } = useWindowDimensions();
  const { studentId: paramStudentId } = useLocalSearchParams<{ studentId?: string }>();
  const [selectedId, setSelectedId] = useState<string | undefined>(paramStudentId);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const refreshLock = useRef(false);

  const pad = Math.max(16, Math.min(24, width * 0.048));
  const mapHeight = Math.max(220, Math.min(Math.round(height * 0.36), 300));

  const tracking = useQuery({
    queryKey: ['parent-tracking'],
    queryFn: fetchParentTracking,
    refetchInterval: 20_000,
  });

  const tracks = tracking.data?.tracks ?? [];

  const focusTrack = useMemo(() => {
    const id = selectedId ?? paramStudentId;
    return tracks.find((t) => t.student_id === id) ?? tracks[0] ?? null;
  }, [tracks, selectedId, paramStudentId]);

  const onRefresh = async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setPullRefreshing(true);
    try {
      await tracking.refetch();
    } finally {
      refreshLock.current = false;
      setPullRefreshing(false);
    }
  };

  const openFullMap = (id?: string) => {
    router.push({ pathname: '/track-map', params: { studentId: id ?? focusTrack?.student_id ?? '' } });
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Track"
        subtitle={
          tracking.data?.updated_at
            ? `Updated ${new Date(tracking.data.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
            : 'Live bus locations'
        }
      />

      <View style={[styles.body, { paddingHorizontal: pad }]}>
        {tracks.length > 1 ? (
          <View style={styles.segment}>
            {tracks.map((t) => {
              const on = t.student_id === focusTrack?.student_id;
              return (
                <Pressable
                  key={t.student_id}
                  style={[styles.segmentItem, on && styles.segmentItemOn]}
                  onPress={() => setSelectedId(t.student_id)}
                >
                  <Text style={[styles.segmentText, on && styles.segmentTextOn]} numberOfLines={1}>
                    {t.student_name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={[styles.mapHero, { height: mapHeight }]}>
          <ParentTrackingMap
            tracks={tracks}
            center={tracking.data?.center}
            focusTrack={focusTrack}
            height={mapHeight}
          onExpand={() => openFullMap(focusTrack?.student_id)}
          topInset={12}
        />
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset + 16 }]}
          refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {tracking.isLoading ? (
            <ActivityIndicator color={RoleAccents.parent} style={{ marginTop: 20 }} />
          ) : tracks.length ? (
            <View style={styles.list}>
              <Text style={styles.listHeading}>Your children</Text>
              {tracks.map((track) => (
                <StudentRow
                  key={track.student_id}
                  track={track}
                  active={track.student_id === focusTrack?.student_id}
                  onPress={() => router.push({ pathname: '/child/[studentId]', params: { studentId: track.student_id } })}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No active buses"
              message="Tracking appears when your child's run is scheduled or in progress."
              icon="bus-outline"
              accent={RoleAccents.parent}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function StudentRow({
  track,
  active,
  onPress,
}: {
  track: ParentTrackItem;
  active: boolean;
  onPress: () => void;
}) {
  const vehicle = track.vehicle;
  const live = track.tracking_status === 'in_progress';

  return (
    <Pressable style={[styles.row, active && styles.rowOn]} onPress={onPress}>
      <PhotoAvatar name={track.student_name} variant="student" size={50} seed={track.student_id} />
      <View style={styles.rowBody}>
        <View style={styles.rowTitle}>
          <Text style={styles.rowName} numberOfLines={1}>{track.student_name}</Text>
          {live ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Live</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {vehicle
            ? `Bus #${vehicle.vehicle_number} · ${Math.round(vehicle.speed_mph)} mph`
            : 'No bus assigned yet'}
        </Text>
        <Text style={styles.rowSchool} numberOfLines={1}>{track.school?.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  body: { flex: 1, paddingTop: 12, gap: 12 },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentItemOn: { backgroundColor: RoleAccents.parent },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  segmentTextOn: { fontSize: 14, fontWeight: '700', color: Colors.white },
  mapHero: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#E8EEF4',
  },
  listScroll: { flex: 1 },
  scroll: { paddingTop: 4, gap: 10 },
  list: { gap: 10 },
  listHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowOn: { borderColor: `${RoleAccents.parent}55`, backgroundColor: `${RoleAccents.parent}08` },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 16, fontWeight: '800', color: Colors.secondary, flexShrink: 1 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  livePillText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  rowMeta: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  rowSchool: { fontSize: 12, color: Colors.textMuted },
});
