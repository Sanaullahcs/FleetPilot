import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { NavigationPickerSheet } from '@/components/maps/navigation-picker-sheet';
import { Card, PrimaryButton, SectionHeader, StatusBadge } from '@/components/ui/primitives';
import { Colors, RoleAccents } from '@/constants/theme';
import { completeDriverStop, fetchDriverAssignment, startDriverAssignment } from '@/lib/mobile-api';
import { formatRunDirection, formatRunStatus, formatTime, formatTimeRange } from '@/lib/format';
import { getNextPendingStop } from '@/lib/maps-navigation';
import type { DriverAssignmentDetail, DriverManifestStudent } from '@/lib/mobile-types';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { showConfirmAlert } from '@/store/sweet-alert';

type StopItem = DriverAssignmentDetail['stops'][number];

function assignmentTone(status: string) {
  if (status === 'in_progress') return 'info' as const;
  if (status === 'completed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  return 'default' as const;
}

function relationshipLabel(value: string | null | undefined) {
  if (!value) return 'Contact';
  if (value === 'emergency') return 'Emergency contact';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function telHref(phone: string) {
  return `tel:${phone.replace(/\D/g, '')}`;
}

export function DriverRunScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [navPickerStop, setNavPickerStop] = useState<StopItem | null>(null);

  const goToInAppNavigation = (stop: StopItem) => {
    router.push(`/run/${assignmentId}/navigate?stopId=${stop.id}`);
  };

  const openNavigationPicker = (stop: StopItem) => {
    setNavPickerStop(stop);
  };

  const detail = useQuery({
    queryKey: ['driver-assignment', assignmentId],
    queryFn: () => fetchDriverAssignment(assignmentId!),
    enabled: Boolean(assignmentId),
  });

  const startRun = useMutation({
    mutationFn: () => startDriverAssignment(assignmentId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['driver-assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['driver-today'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });

      const refreshed = await queryClient.fetchQuery({
        queryKey: ['driver-assignment', assignmentId],
        queryFn: () => fetchDriverAssignment(assignmentId!),
      });
      const next = getNextPendingStop(refreshed.stops);
      if (next) {
        goToInAppNavigation(next);
      }
    },
  });

  const completeStop = useMutation({
    mutationFn: (runStopId: string) => completeDriverStop(assignmentId!, runStopId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['driver-assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['driver-today'] });

      const refreshed = await queryClient.fetchQuery({
        queryKey: ['driver-assignment', assignmentId],
        queryFn: () => fetchDriverAssignment(assignmentId!),
      });
      const next = getNextPendingStop(refreshed.stops);
      if (next) {
        goToInAppNavigation(next);
      }
    },
  });

  const data = detail.data;
  const status = data?.assignment.status ?? 'scheduled';
  const canStart = status === 'scheduled';
  const isActive = status === 'in_progress';
  const isDone = status === 'completed' || status === 'cancelled';
  const completedStops = data?.progress?.completed_stops ?? data?.stops.filter((s) => s.status === 'completed').length ?? 0;
  const totalStops = data?.progress?.total_stops ?? data?.stops.length ?? 0;
  const progressPct = totalStops > 0 ? completedStops / totalStops : 0;
  const nextStop = data ? getNextPendingStop(data.stops) : undefined;
  const hasFooter = canStart || (isActive && !!nextStop);

  const navigateToStop = (stop: StopItem) => {
    openNavigationPicker(stop);
  };

  const onStartRun = () => {
    showConfirmAlert(
      'Start this run?',
      'GPS tracking will begin and navigation will open to your first stop.',
      () => startRun.mutate(),
      { confirmText: 'Start & navigate', cancelText: 'Not yet' },
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title={data?.run?.name ?? 'Run manifest'}
        subtitle={data?.route?.school ?? 'Route details'}
        onBackPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, hasFooter && { paddingBottom: 130 }]}
        refreshControl={<RefreshControl refreshing={detail.isFetching && !detail.isLoading} onRefresh={() => detail.refetch()} />}
      >
        {detail.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : data ? (
          <>
            <Card style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{data.route?.name ?? 'Assigned route'}</Text>
                  <Text style={styles.routeMeta}>
                    {formatTimeRange(data.run?.scheduled_start_time, data.run?.scheduled_end_time)} ·{' '}
                    {formatRunDirection(data.run?.direction)}
                  </Text>
                </View>
                <StatusBadge label={formatRunStatus(status)} tone={assignmentTone(status)} />
              </View>
              <View style={styles.statsRow}>
                <Stat label="Stops" value={String(data.stops.length)} icon="location-outline" />
                <Stat label="Students" value={String(data.students.length)} icon="people-outline" />
                <Stat label="Bus" value={data.vehicle?.vehicle_number ?? 'TBD'} icon="bus-outline" />
              </View>

              {(isActive || isDone) && totalStops > 0 ? (
                <View style={styles.progressBox}>
                  <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>Stop progress</Text>
                    <Text style={styles.progressCount}>
                      {completedStops} / {totalStops}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
                  </View>
                </View>
              ) : null}

              {canStart ? (
                <View style={styles.readyBox}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                  <Text style={styles.readyText}>
                    Review stops and parent contacts below, then start the run. Mark each stop complete once students are boarded.
                  </Text>
                </View>
              ) : null}

              {isActive ? (
                <View style={styles.activeBanner}>
                  <Ionicons name="radio-button-on" size={14} color={RoleAccents.driver} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeTitle}>Run in progress</Text>
                    <Text style={styles.activeText}>
                      Navigate in FleetPilot or switch to another maps app · mark each stop when finished
                    </Text>
                  </View>
                </View>
              ) : null}

              {isDone ? (
                <View style={styles.doneBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.doneText}>All stops finished · run {formatRunStatus(status).toLowerCase()}</Text>
                </View>
              ) : null}
            </Card>

            <SectionHeader
              title="Stop sequence"
              subtitle={
                canStart
                  ? `${totalStops} stops · mark complete after you start the run`
                  : `${totalStops} stops · parent contacts at each pickup`
              }
            />
            {data.stops.map((stop, index) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={index}
                runStarted={isActive || isDone}
                isNext={nextStop?.id === stop.id && isActive}
                onNavigate={() => navigateToStop(stop)}
                onComplete={() => completeStop.mutate(stop.id)}
                completing={completeStop.isPending && completeStop.variables === stop.id}
              />
            ))}

            {data.students.length > 0 ? (
              <>
                <SectionHeader title="Full manifest" subtitle="All riders on this run" />
                {data.students.map((student) => (
                  <Card key={student.id} style={styles.manifestCard}>
                    <StudentContactCard student={student} showStatus />
                  </Card>
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {canStart && data ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.footerHint}>Starts GPS · opens navigation to first stop</Text>
          <PrimaryButton
            label={startRun.isPending ? 'Starting…' : 'Start run & navigate'}
            icon="navigate"
            onPress={onStartRun}
            disabled={startRun.isPending}
          />
        </View>
      ) : null}

      {isActive && nextStop ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.footerHint} numberOfLines={1}>
            Next: {nextStop.name}
          </Text>
          <PrimaryButton
            label="Navigate to next stop"
            icon="navigate"
            onPress={() => navigateToStop(nextStop)}
          />
        </View>
      ) : null}

      <NavigationPickerSheet
        visible={!!navPickerStop}
        stop={navPickerStop}
        onClose={() => setNavPickerStop(null)}
        onInAppNavigate={goToInAppNavigation}
      />
    </View>
  );
}

function StopCard({
  stop,
  index,
  runStarted,
  isNext,
  onNavigate,
  onComplete,
  completing,
}: {
  stop: StopItem;
  index: number;
  runStarted: boolean;
  isNext?: boolean;
  onNavigate: () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  const isCompleted = stop.status === 'completed';
  const isFirst = index === 0 && !isCompleted;

  return (
    <Card style={[styles.stopCard, isCompleted && styles.stopCardDone, isNext && styles.stopCardNext]}>
      <View style={styles.stopRow}>
        <View style={[styles.stopNum, isCompleted && styles.stopNumDone, isFirst && styles.stopNumFirst]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          ) : (
            <Text style={[styles.stopNumText, isFirst && styles.stopNumTextFirst]}>{stop.sequence}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.stopTitleRow}>
            <Text style={[styles.stopName, isCompleted && styles.stopNameDone]}>{stop.name}</Text>
            {isCompleted ? (
              <StatusBadge label="Done" tone="success" />
            ) : isNext ? (
              <StatusBadge label="Next stop" tone="driver" />
            ) : stop.students?.length ? (
              <View style={styles.riderChip}>
                <Text style={styles.riderChipText}>
                  {stop.students.length} rider{stop.students.length === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.stopAddress}>{stop.address}</Text>
          {isCompleted && stop.completed_at ? (
            <Text style={styles.completedTime}>
              Completed · {new Date(stop.completed_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          ) : (
            <Text style={styles.stopTime}>ETA {formatTime(stop.estimated_arrival ?? stop.scheduled_time)}</Text>
          )}
        </View>
      </View>

      {stop.students?.length ? (
        <View style={styles.stopStudents}>
          {stop.students.map((student) => (
            <StudentContactCard key={student.id} student={student} dimmed={isCompleted} />
          ))}
        </View>
      ) : stop.type === 'student' ? (
        <Text style={styles.noStudents}>No students assigned to this stop</Text>
      ) : null}

      {!isCompleted ? (
        <Pressable style={styles.mapsBtn} onPress={onNavigate}>
          <Ionicons name="navigate" size={18} color={RoleAccents.driver} />
          <Text style={styles.mapsBtnText}>Navigate</Text>
        </Pressable>
      ) : null}

      {!isCompleted && runStarted ? (
        <Pressable
          style={[styles.markDoneBtn, completing && styles.markDoneBtnDisabled]}
          onPress={onComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
              <Text style={styles.markDoneText}>Mark stop complete</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {!runStarted && !isCompleted ? (
        <View style={styles.pendingHint}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.placeholder} />
          <Text style={styles.pendingHintText}>Check-off available after you start the run</Text>
        </View>
      ) : null}
    </Card>
  );
}

function StudentContactCard({
  student,
  showStatus,
  dimmed,
}: {
  student: DriverManifestStudent;
  showStatus?: boolean;
  dimmed?: boolean;
}) {
  const parent = student.parent;

  return (
    <View style={[styles.contactCard, dimmed && styles.contactCardDimmed]}>
      <View style={styles.contactHeader}>
        <PhotoAvatar name={student.name} size={42} seed={student.id} />
        <View style={styles.contactHeaderText}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentMeta}>Grade {student.grade ?? '—'}</Text>
        </View>
        {showStatus ? <StatusBadge label="Expected" tone="info" /> : null}
      </View>

      {parent?.name || parent?.phone ? (
        <View style={styles.parentSection}>
          <Text style={styles.parentEyebrow}>{relationshipLabel(parent?.relationship ?? 'guardian')}</Text>
          {parent.name ? <Text style={styles.parentNameLarge}>{parent.name}</Text> : null}
          {parent.phone ? (
            <Pressable style={styles.callBtn} onPress={() => Linking.openURL(telHref(parent.phone!))}>
              <Ionicons name="call" size={16} color={Colors.white} />
              <Text style={styles.callBtnText}>{parent.phone}</Text>
            </Pressable>
          ) : (
            <Text style={styles.noPhone}>No phone on file</Text>
          )}
        </View>
      ) : (
        <Text style={styles.noPhone}>No parent contact on file</Text>
      )}
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={Colors.primary} style={{ marginBottom: 4 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 12 },
  hero: { gap: 14 },
  heroTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  routeName: { fontSize: 17, fontWeight: '800', color: Colors.secondary },
  routeMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 17, fontWeight: '800', color: Colors.secondary },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase', marginTop: 2 },
  progressBox: { gap: 8 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  progressCount: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 999 },
  readyBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}22`,
  },
  readyText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.primaryDark, fontWeight: '500' },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${RoleAccents.driver}15`,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${RoleAccents.driver}33`,
  },
  activeTitle: { fontSize: 14, fontWeight: '700', color: RoleAccents.driver },
  activeText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
  },
  doneText: { fontSize: 13, fontWeight: '600', color: '#15803D', flex: 1 },
  stopCard: { paddingVertical: 14, gap: 12 },
  stopCardDone: { borderColor: `${Colors.success}44`, backgroundColor: '#F0FDF4' },
  stopCardNext: { borderColor: `${RoleAccents.driver}66`, borderWidth: 2 },
  stopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stopTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stopNum: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumFirst: { backgroundColor: Colors.primary },
  stopNumDone: { backgroundColor: Colors.success },
  stopNumText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  stopNumTextFirst: { color: Colors.white },
  stopName: { fontSize: 15, fontWeight: '700', color: Colors.secondary, flex: 1 },
  stopNameDone: { color: Colors.textSecondary },
  riderChip: {
    backgroundColor: `${RoleAccents.driver}18`,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riderChipText: { fontSize: 10, fontWeight: '700', color: RoleAccents.driver },
  stopAddress: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  stopTime: { fontSize: 11, fontWeight: '600', color: Colors.accentDark, marginTop: 4 },
  completedTime: { fontSize: 11, fontWeight: '700', color: Colors.success, marginTop: 4 },
  stopStudents: { gap: 10 },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${RoleAccents.driver}12`,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${RoleAccents.driver}44`,
  },
  mapsBtnText: { color: RoleAccents.driver, fontSize: 14, fontWeight: '700' },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  markDoneBtnDisabled: { opacity: 0.7 },
  markDoneText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  pendingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pendingHintText: { fontSize: 12, color: Colors.placeholder, fontStyle: 'italic', flex: 1 },
  manifestCard: { paddingVertical: 12 },
  contactCard: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  contactCardDimmed: { opacity: 0.85 },
  contactHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  contactHeaderText: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  studentMeta: { fontSize: 12, color: Colors.textMuted },
  parentSection: { gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  parentEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  parentNameLarge: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 4,
  },
  callBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  noPhone: { fontSize: 12, color: Colors.placeholder, fontStyle: 'italic' },
  noStudents: {
    fontSize: 12,
    color: Colors.placeholder,
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  footerHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
