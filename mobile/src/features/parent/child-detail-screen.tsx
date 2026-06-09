import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { Card, PrimaryButton, StatusBadge } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchParentChildren, fetchParentTracking } from '@/lib/mobile-api';
import { showConfirmAlert, showSweetAlert } from '@/store/sweet-alert';

export function ChildDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();

  const children = useQuery({ queryKey: ['parent-children'], queryFn: fetchParentChildren });
  const tracking = useQuery({ queryKey: ['parent-tracking'], queryFn: fetchParentTracking });

  const child = children.data?.find((c) => c.student.id === studentId);
  const track = tracking.data?.tracks.find((t) => t.student_id === studentId);
  const name = child ? `${child.student.first_name} ${child.student.last_name}` : 'Student';

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
        <Card style={{ margin: 18 }}>
          <Text style={styles.body}>This student could not be loaded.</Text>
        </Card>
      </View>
    );
  }

  const nextRun = child.routes_today.flatMap((r) => r.runs)[0];
  const status = track?.tracking_status ?? nextRun?.assignment?.status ?? 'scheduled';

  return (
    <View style={styles.root}>
      <AppHeader title={name} subtitle={child.school?.name ?? 'Student profile'} onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.hero}>
          <PhotoAvatar name={name} size={80} seed={child.student.id} />
          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroMeta}>Grade {child.student.grade} · {child.school?.name}</Text>
          <StatusBadge label={status.replace('_', ' ')} tone={status === 'in_progress' ? 'success' : 'info'} />
        </Card>

        {track?.vehicle ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Live bus status</Text>
            <View style={styles.busRow}>
              <PhotoAvatar name={track.vehicle.vehicle_number} size={52} variant="bus" seed={track.vehicle.id} />
              <View style={{ flex: 1 }}>
                <Text style={styles.busTitle}>Bus #{track.vehicle.vehicle_number}</Text>
                <Text style={styles.busMeta}>{Math.round(track.vehicle.speed_mph)} mph · Plate {track.vehicle.license_plate}</Text>
              </View>
            </View>
            {track.vehicle.driver ? (
              <View style={styles.driverRow}>
                <PhotoAvatar
                  name={`${track.vehicle.driver.first_name} ${track.vehicle.driver.last_name}`}
                  size={44}
                  seed={track.vehicle.driver.phone}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>
                    {track.vehicle.driver.first_name} {track.vehicle.driver.last_name}
                  </Text>
                  <Text style={styles.driverMeta}>Assigned driver</Text>
                </View>
                <Pressable style={styles.callBtn} onPress={callDriver}>
                  <Ionicons name="call" size={18} color={Colors.white} />
                </Pressable>
              </View>
            ) : null}
          </Card>
        ) : null}

        {nextRun ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Today's run</Text>
            <Text style={styles.runLine}>{nextRun.name}</Text>
            <Text style={styles.runSub}>
              {nextRun.scheduled_start_time} – {nextRun.scheduled_end_time} · {nextRun.direction.replace('_', ' ')}
            </Text>
          </Card>
        ) : null}

        <PrimaryButton
          label="Open live map"
          icon="locate-outline"
          onPress={() => {
            showSweetAlert({ type: 'success', title: 'Opening tracker', message: 'Switching to the live map view.' });
            router.push('/track');
          }}
        />
        <PrimaryButton
          label="Report absence"
          icon="calendar-outline"
          onPress={() =>
            showConfirmAlert(
              'Report absence?',
              'Dispatch will be notified that your child will not ride today.',
              () => showSweetAlert({ type: 'success', title: 'Absence reported', message: 'Dispatch has been notified.' }),
              { confirmText: 'Report absence' },
            )
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 14 },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  heroName: { fontSize: 22, fontWeight: '800', color: Colors.secondary },
  heroMeta: { fontSize: 13, color: Colors.textMuted },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase' },
  busRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  busTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
  busMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  driverRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  driverMeta: { fontSize: 12, color: Colors.textMuted },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runLine: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  runSub: { fontSize: 13, color: Colors.textSecondary },
  body: { fontSize: 14, color: Colors.textSecondary },
});
