import { useEffect } from 'react';
import { Colors } from '@/constants/theme';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiRequest } from '@/lib/api';
import { fetchMe, logout } from '@/lib/auth-api';

interface Stats {
  students: { total: number; active: number };
  drivers: { total: number; active: number };
  vehicles: { total: number; active: number };
  routes: { total: number; active: number };
  runs: { total: number };
}

function useDashboardStats(enabled: boolean) {
  return useQuery({
    queryKey: ['mobile-stats'],
    enabled,
    queryFn: async () => {
      const res = await apiRequest<{ data: Stats }>('/dashboard/stats');
      return res.data;
    },
  });
}

export function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const { width } = useWindowDimensions();

  // Revalidate the profile on mount so role/permissions stay fresh.
  useEffect(() => {
    fetchMe().then(setUser).catch(() => {});
  }, [setUser]);

  const isStaff = user?.role === 'admin' || user?.role === 'dispatcher';
  const { data: stats, isLoading } = useDashboardStats(Boolean(isStaff));

  const cardWidth = width >= 600 ? '31%' : '47%';

  const onLogout = async () => {
    await logout();
    await clear();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.first_name} 👋</Text>
            <Text style={styles.role}>
              {user?.role?.toUpperCase()} · {user?.organization?.name ?? 'FleetPilot'}
            </Text>
          </View>
          <Pressable style={styles.signOut} onPress={onLogout}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        {isStaff && (
          <>
            <Text style={styles.sectionTitle}>Operations overview</Text>
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.grid}>
                <StatCard label="Students" value={stats?.students.total} width={cardWidth} />
                <StatCard label="Drivers" value={stats?.drivers.total} width={cardWidth} />
                <StatCard label="Vehicles" value={stats?.vehicles.total} width={cardWidth} />
                <StatCard label="Routes" value={stats?.routes.total} width={cardWidth} />
                <StatCard label="Runs" value={stats?.runs.total} width={cardWidth} />
              </View>
            )}
          </>
        )}

        {user?.role === 'driver' && (
          <RolePanel
            title="Today's assignment"
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
            lines={[
              'Track your child’s bus in real time.',
              'Get notified at pickup and drop-off.',
            ]}
            cta="View students"
          />
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account</Text>
          <Text style={styles.infoLine}>{user?.full_name}</Text>
          <Text style={styles.infoLineMuted}>{user?.email}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  width,
}: {
  label: string;
  value?: number;
  width: string | number;
}) {
  return (
    <View style={[styles.card, { width: width as never }]}>
      <Text style={styles.cardValue}>{value ?? '—'}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

function RolePanel({ title, lines, cta }: { title: string; lines: string[]; cta: string }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.panelLine}>
          • {line}
        </Text>
      ))}
      <Pressable style={styles.panelButton}>
        <Text style={styles.panelButtonText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 20, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.secondary },
  role: { fontSize: 12, color: '#64748b', marginTop: 2, letterSpacing: 0.5 },
  signOut: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  signOutText: { color: '#334155', fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.secondary, marginTop: 8, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardValue: { fontSize: 28, fontWeight: '700', color: Colors.secondary },
  cardLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  panelTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary, marginBottom: 10 },
  panelLine: { fontSize: 14, color: '#475569', marginBottom: 6, lineHeight: 20 },
  panelButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  panelButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  infoTitle: { fontSize: 13, fontWeight: '600', color: Colors.secondary, marginBottom: 8 },
  infoLine: { fontSize: 15, color: Colors.secondary },
  infoLineMuted: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
