import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/shell/app-header';
import { LiveMapPreview } from '@/components/maps/live-map-preview';
import { Card, EmptyState, PressableCard, SectionHeader, StatusBadge } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchParentTracking } from '@/lib/mobile-api';
import { showSweetAlert } from '@/store/sweet-alert';

function trackingTone(status: string) {
  if (status === 'in_progress') return 'success' as const;
  if (status === 'scheduled') return 'info' as const;
  if (status === 'assigned') return 'warning' as const;
  return 'default' as const;
}

export function ParentTrackScreen() {
  const router = useRouter();
  const tracking = useQuery({
    queryKey: ['parent-tracking'],
    queryFn: fetchParentTracking,
    refetchInterval: 30_000,
  });

  return (
    <View style={styles.root}>
      <AppHeader title="Live tracking" subtitle="Bus location & ETA" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={tracking.isFetching}
            onRefresh={() => {
              tracking.refetch();
              showSweetAlert({ type: 'success', title: 'Map updated', message: 'Live positions refreshed.' });
            }}
          />
        }
      >
        <Pressable
          onPress={() =>
            showSweetAlert({
              type: 'info',
              title: 'Live GPS map',
              message: 'Full interactive maps will open here. Positions refresh every 30 seconds.',
            })
          }
        >
          <Card style={styles.mapCard}>
            <LiveMapPreview tracks={tracking.data?.tracks ?? []} center={tracking.data?.center} />
            {tracking.data?.updated_at ? (
              <Text style={styles.updated}>Updated {new Date(tracking.data.updated_at).toLocaleTimeString()}</Text>
            ) : null}
          </Card>
        </Pressable>

        <SectionHeader title="Children on route" subtitle="Tap a student for full details" />

        {tracking.isLoading ? (
          <ActivityIndicator color={RoleAccents.parent} style={{ marginTop: 20 }} />
        ) : tracking.data?.tracks.length ? (
          tracking.data.tracks.map((track) => (
            <PressableCard
              key={track.student_id}
              style={styles.trackCard}
              onPress={() =>
                router.push({ pathname: '/child/[studentId]', params: { studentId: track.student_id } })
              }
            >
              <View style={styles.trackTop}>
                <PhotoAvatar name={track.student_name} size={46} seed={track.student_id} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{track.student_name}</Text>
                  <Text style={styles.schoolLine}>{track.school?.name ?? 'School route'}</Text>
                </View>
                <StatusBadge label={track.tracking_status.replace('_', ' ')} tone={trackingTone(track.tracking_status)} />
              </View>
              {track.vehicle ? (
                <>
                  <View style={styles.coordsRow}>
                    <Coord label="Bus" value={`#${track.vehicle.vehicle_number}`} />
                    <Coord label="Speed" value={`${Math.round(track.vehicle.speed_mph)} mph`} />
                    <Coord label="Plate" value={track.vehicle.license_plate} />
                  </View>
                  {track.run ? (
                    <Text style={styles.runInfo}>
                      {track.run.name} · {track.run.scheduled_start_time} · {track.run.route_name}
                    </Text>
                  ) : null}
                  {track.vehicle.driver ? (
                    <View style={styles.driverRow}>
                      <PhotoAvatar
                        name={`${track.vehicle.driver.first_name} ${track.vehicle.driver.last_name}`}
                        size={32}
                        seed={track.vehicle.driver.phone}
                      />
                      <Text style={styles.driverInfo}>
                        Driver: {track.vehicle.driver.first_name} {track.vehicle.driver.last_name}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.unavailable}>No vehicle assigned for tracking right now.</Text>
              )}
            </PressableCard>
          ))
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

function Coord({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.coord}>
      <Text style={styles.coordLabel}>{label}</Text>
      <Text style={styles.coordValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 32, gap: 14 },
  mapCard: { padding: 0, overflow: 'hidden' },
  updated: { fontSize: 11, color: Colors.textMuted, padding: 12, paddingTop: 8 },
  trackCard: { gap: 10 },
  trackTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  studentName: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
  schoolLine: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  coordsRow: { flexDirection: 'row', gap: 8 },
  coord: { flex: 1, backgroundColor: Colors.backgroundElement, borderRadius: 12, padding: 10 },
  coordLabel: { fontSize: 10, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase' },
  coordValue: { fontSize: 14, fontWeight: '700', color: Colors.secondary, marginTop: 2 },
  runInfo: { fontSize: 13, color: Colors.textSecondary },
  driverRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  driverInfo: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  unavailable: { fontSize: 13, color: Colors.textMuted },
});
