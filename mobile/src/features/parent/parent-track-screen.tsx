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
import { ParentLiveMap } from '@/components/maps/parent-live-map';
import { EmptyState } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { fetchParentTracking } from '@/lib/mobile-api';
import type { ParentTrackItem } from '@/lib/mobile-types';

export function ParentTrackScreen() {
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { width } = useWindowDimensions();
  const { studentId: paramStudentId } = useLocalSearchParams<{ studentId?: string }>();
  const [selectedId, setSelectedId] = useState<string | undefined>(paramStudentId);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const refreshLock = useRef(false);

  const pad = Math.max(16, Math.min(22, width * 0.05));
  const mapHeight = Math.min(Math.round(width * 0.44), 240);

  const tracking = useQuery({
    queryKey: ['parent-tracking'],
    queryFn: fetchParentTracking,
    refetchInterval: 30_000,
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
            : 'Your children on the route'
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: pad, paddingBottom: tabBarInset + 20 }]}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.mapBlock}>
          <ParentLiveMap
            tracks={tracks}
            center={tracking.data?.center}
            focusTrack={focusTrack}
            height={mapHeight}
            onExpand={() => openFullMap(focusTrack?.student_id)}
          />
        </View>

        {tracking.isLoading ? (
          <ActivityIndicator color={RoleAccents.parent} style={{ marginTop: 24 }} />
        ) : tracks.length ? (
          <View style={styles.list}>
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
      <PhotoAvatar name={track.student_name} size={44} seed={track.student_id} />
      <View style={styles.rowBody}>
        <View style={styles.rowTitle}>
          <Text style={styles.rowName} numberOfLines={1}>{track.student_name}</Text>
          {live ? <View style={styles.liveDot} /> : null}
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {vehicle
            ? `#${vehicle.vehicle_number} · ${Math.round(vehicle.speed_mph)} mph · ${track.school?.name}`
            : track.school?.name ?? 'No bus yet'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { paddingTop: 12, gap: 16 },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentItemOn: { backgroundColor: RoleAccents.parent },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  segmentTextOn: { fontSize: 13, fontWeight: '700', color: Colors.white },
  mapBlock: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowOn: { borderColor: `${RoleAccents.parent}44`, backgroundColor: `${RoleAccents.parent}06` },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 16, fontWeight: '700', color: Colors.secondary, flexShrink: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  rowMeta: { fontSize: 13, color: Colors.textMuted },
});
