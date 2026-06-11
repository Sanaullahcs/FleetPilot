import { useEffect } from 'react';
import { Colors, RoleAccents } from '@/constants/theme';
import { ui } from '@/constants/ui-styles';
import { isMobileRole } from '@/constants/app';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { fetchMe, signOut } from '@/lib/auth-api';
import { FleetPilotLogoMark } from '@/components/brand/logo-mark';

const roleAccent = (role?: string) => {
  if (role === 'driver') return RoleAccents.driver;
  if (role === 'parent') return RoleAccents.parent;
  return Colors.primary;
};

const roleLabel = (role?: string) => {
  if (role === 'driver') return 'Driver';
  if (role === 'parent') return 'Parent';
  return role?.toUpperCase() ?? '';
};

export function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchMe()
      .then((profile) => {
        if (!isMobileRole(profile.role)) {
          signOut({ queryClient }).finally(() => router.replace('/sign-in'));
          return;
        }
        setUser(profile);
      })
      .catch(() => {});
  }, [setUser, queryClient, router]);

  const accent = roleAccent(user?.role);

  const onLogout = async () => {
    await signOut({ queryClient });
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <FleetPilotLogoMark size={40} />
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Hi, {user?.first_name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: `${accent}18` }]}>
                  <View style={[styles.roleDot, { backgroundColor: accent }]} />
                  <Text style={[styles.role, { color: accent }]}>{roleLabel(user?.role)}</Text>
                </View>
                <Text style={styles.orgName}>{user?.organization?.name ?? 'FleetPilot'}</Text>
              </View>
            </View>
            <Pressable style={ui.ghostButton} onPress={onLogout}>
              <Text style={ui.ghostButtonText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        {user?.role === 'driver' && (
          <RolePanel
            title="Today's assignment"
            accent={RoleAccents.driver}
            lines={[
              'Your assigned runs will appear here.',
              'Start a run to begin GPS tracking and student check-ins.',
            ]}
            cta="View my runs"
          />
        )}

        {user?.role === 'parent' && (
          <RolePanel
            title="My students"
            accent={RoleAccents.parent}
            lines={[
              'Track your child’s bus in real time.',
              'Get notified at pickup and drop-off.',
            ]}
            cta="View students"
          />
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoEyebrow}>Account</Text>
          <Text style={styles.infoLine}>{user?.full_name}</Text>
          <Text style={styles.infoLineMuted}>{user?.email}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RolePanel({
  title,
  lines,
  cta,
  accent,
}: {
  title: string;
  lines: string[];
  cta: string;
  accent: string;
}) {
  return (
    <View style={styles.panel}>
      <View style={[styles.panelAccent, { backgroundColor: accent }]} />
      <Text style={styles.panelTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.panelLine}>
          • {line}
        </Text>
      ))}
      <Pressable style={[styles.panelButton, { backgroundColor: accent }]}>
        <Text style={styles.panelButtonText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 20, gap: 8 },
  headerCard: {
    ...ui.cardCompact,
    padding: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  headerText: { flex: 1, justifyContent: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.secondary },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  roleDot: { width: 6, height: 6, borderRadius: 999 },
  role: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  orgName: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  panel: {
    ...ui.cardCompact,
    padding: 18,
    marginTop: 16,
    overflow: 'hidden',
  },
  panelAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary, marginBottom: 10, marginTop: 4 },
  panelLine: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6, lineHeight: 20 },
  panelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  panelButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  infoCard: {
    ...ui.cardCompact,
    padding: 18,
    marginTop: 16,
  },
  infoEyebrow: {
    ...ui.sectionEyebrow,
    marginBottom: 8,
  },
  infoLine: { fontSize: 15, color: Colors.secondary, fontWeight: '600' },
  infoLineMuted: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
