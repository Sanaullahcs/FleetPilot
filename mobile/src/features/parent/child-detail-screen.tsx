import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParentTrackingMap } from '@/components/maps/parent-tracking-map';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { formatTimeRange } from '@/lib/format';
import { fetchParentChildren, fetchParentTracking } from '@/lib/mobile-api';
import {
  findDriverConversationForStudent,
  findParentSupportConversation,
  findSchoolConversationForSchool,
} from '@/lib/chat-api';
import { showConfirmAlert, showSweetAlert } from '@/store/sweet-alert';

export function ChildDetailScreen() {
  const { studentId: studentIdParam } = useLocalSearchParams<{ studentId: string | string[] }>();
  const studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pad = Math.max(16, Math.min(24, width * 0.048));
  const mapHeight = Math.max(260, Math.min(Math.round(height * 0.42), 360));
  const compact = width < 380;

  const children = useQuery({ queryKey: ['parent-children'], queryFn: fetchParentChildren });
  const tracking = useQuery({ queryKey: ['parent-tracking'], queryFn: fetchParentTracking, refetchInterval: 20_000 });

  const child = children.data?.find((c) => c.student.id === studentId);
  const track = tracking.data?.tracks.find((t) => t.student_id === studentId);
  const name = child ? `${child.student.first_name} ${child.student.last_name}` : 'Student';
  const vehicle = track?.vehicle;
  const nextRun = child?.routes_today.flatMap((r) => r.runs)[0];
  const live = track?.tracking_status === 'in_progress';

  const openFullMap = () => router.push({ pathname: '/track-map', params: { studentId: child!.student.id } });

  const openDriverChat = async () => {
    if (!studentId) {
      router.push('/messages');
      return;
    }
    try {
      const conversation = await findDriverConversationForStudent(studentId);
      if (conversation) {
        router.push(`/chat/${conversation.id}`);
        return;
      }
    } catch {
      // fall through to messages list
    }
    router.push('/messages');
  };

  const openSchoolChat = async () => {
    const schoolId = child?.school?.id;
    if (!schoolId) {
      router.push('/messages');
      return;
    }
    try {
      const conversation = await findSchoolConversationForSchool(schoolId);
      if (conversation) {
        router.push(`/chat/${conversation.id}`);
        return;
      }
    } catch {
      // fall through
    }
    router.push('/messages');
  };

  const openSupportChat = async () => {
    try {
      const conversation = await findParentSupportConversation();
      if (conversation) {
        router.push(`/chat/${conversation.id}`);
        return;
      }
    } catch {
      // fall through
    }
    router.push('/messages');
  };

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
        <ActivityIndicator color={RoleAccents.parent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.root}>
        <Pressable style={[styles.mapToolBtn, { position: 'absolute', top: insets.top + 14, left: pad }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
        </Pressable>
        <Text style={styles.notFound}>This student could not be loaded.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={{ height: mapHeight }}>
        <ParentTrackingMap
          tracks={track ? [track] : []}
          focusTrack={track ?? null}
          height={mapHeight}
          hideOverlay
          hideExpand
          showMapLabel={false}
        />
        <View style={[styles.mapToolbar, { paddingTop: insets.top + 14, paddingHorizontal: pad }]}>
          <Pressable style={styles.mapToolBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
          </Pressable>
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>Minnesota · Preview</Text>
          </View>
          <Pressable style={styles.mapToolBtn} onPress={openFullMap} hitSlop={8}>
            <Ionicons name="expand-outline" size={20} color={Colors.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView
          contentContainerStyle={[
            styles.sheetScroll,
            { paddingHorizontal: pad, paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileRow}>
            <PhotoAvatar name={name} size={compact ? 48 : 54} seed={child.student.id} />
            <View style={styles.profileText}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.meta}>
                Grade {child.student.grade} · {child.school?.name ?? 'School'}
              </Text>
              {live ? (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>On route now</Text>
                </View>
              ) : vehicle ? (
                <Text style={styles.busLine}>
                  Bus #{vehicle.vehicle_number} · {Math.round(vehicle.speed_mph)} mph
                </Text>
              ) : null}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsRow}
          >
            <ActionChip icon="call-outline" label="Call" onPress={callDriver} />
            <ActionChip icon="chatbubbles-outline" label="Driver" onPress={() => void openDriverChat()} />
            <ActionChip icon="school-outline" label="School" onPress={() => void openSchoolChat()} />
            <ActionChip icon="headset-outline" label="Transport" onPress={() => void openSupportChat()} />
            <ActionChip
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
          </ScrollView>

          {vehicle ? (
            <InfoCard
              icon="bus-outline"
              title={`Bus #${vehicle.vehicle_number}`}
              subtitle={`${Math.round(vehicle.speed_mph)} mph · heading ${Math.round(vehicle.heading)}°`}
              accent={live ? Colors.success : RoleAccents.parent}
            />
          ) : null}

          {vehicle?.driver ? (
            <View style={styles.driverCard}>
              <PhotoAvatar
                name={`${vehicle.driver.first_name} ${vehicle.driver.last_name}`}
                size={44}
                seed={vehicle.driver.phone}
              />
              <View style={styles.driverBody}>
                <Text style={styles.driverLabel}>Your driver</Text>
                <Text style={styles.driverName}>
                  {vehicle.driver.first_name} {vehicle.driver.last_name}
                </Text>
              </View>
              <Pressable style={styles.driverCall} onPress={callDriver}>
                <Ionicons name="call" size={18} color={Colors.white} />
              </Pressable>
            </View>
          ) : null}

          {nextRun ? (
            <InfoCard
              icon="time-outline"
              title={formatTimeRange(nextRun.scheduled_start_time, nextRun.scheduled_end_time)}
              subtitle={nextRun.name}
            />
          ) : null}

          {tracking.data?.updated_at ? (
            <Text style={styles.updated}>
              Location updated {new Date(tracking.data.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable style={[styles.chip, primary && styles.chipPrimary]} onPress={onPress}>
      <Ionicons name={icon} size={17} color={primary ? Colors.white : RoleAccents.parent} />
      <Text style={[styles.chipLabel, primary && styles.chipLabelPrimary]}>{label}</Text>
    </Pressable>
  );
}

function InfoCard({
  icon,
  title,
  subtitle,
  accent = RoleAccents.parent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: `${accent}14` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const glass = {
  backgroundColor: 'rgba(255,255,255,0.97)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.75)',
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  mapToolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mapToolBtn: {
    ...glass,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  previewPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  notFound: { marginTop: 120, textAlign: 'center', color: Colors.textMuted, fontSize: 15, paddingHorizontal: 24 },
  sheet: {
    flex: 1,
    marginTop: -20,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: 10,
    marginBottom: 6,
  },
  sheetScroll: { paddingTop: 4, gap: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileText: { flex: 1, gap: 4 },
  name: { fontSize: 21, fontWeight: '800', color: Colors.secondary, letterSpacing: -0.3 },
  meta: { fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  busLine: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  actionsRow: { flexDirection: 'row', gap: 10, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: `${RoleAccents.parent}10`,
    borderWidth: 1,
    borderColor: `${RoleAccents.parent}24`,
  },
  chipPrimary: { backgroundColor: RoleAccents.parent, borderColor: RoleAccents.parent },
  chipLabel: { fontSize: 13, fontWeight: '700', color: RoleAccents.parent },
  chipLabelPrimary: { color: Colors.white },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.backgroundMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: { flex: 1, gap: 3 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
  infoSub: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverBody: { flex: 1, gap: 3 },
  driverLabel: { fontSize: 11, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase', letterSpacing: 0.4 },
  driverName: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
  driverCall: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: RoleAccents.parent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updated: { fontSize: 12, color: Colors.placeholder, textAlign: 'center', paddingTop: 2 },
});
