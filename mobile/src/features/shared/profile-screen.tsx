import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { Card, ListRow, StatusBadge } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors, RoleAccents } from '@/constants/theme';
import { fetchMe, signOut } from '@/lib/auth-api';
import { fetchDriverProfile } from '@/lib/mobile-api';
import { useAuthStore } from '@/store/auth';
import { showConfirmAlert, showSweetAlert } from '@/store/sweet-alert';

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDriver = user?.role === 'driver';
  const accent = isDriver ? RoleAccents.driver : RoleAccents.parent;

  const driverProfile = useQuery({
    queryKey: ['driver-profile'],
    queryFn: fetchDriverProfile,
    enabled: isDriver,
  });

  const meQuery = useQuery({
    queryKey: ['auth-me-profile'],
    queryFn: fetchMe,
    enabled: Boolean(user),
  });

  const displayUser = meQuery.data ?? user;

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  const onLogout = () => {
    showConfirmAlert('Sign out?', 'You will need to sign in again to access the app.', async () => {
      await signOut({ queryClient });
      router.replace('/sign-in');
    }, { confirmText: 'Sign out' });
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Profile" subtitle="Account & settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.hero}>
          <View style={styles.heroRow}>
            <PhotoAvatar name={displayUser?.full_name ?? 'User'} size={56} seed={displayUser?.id} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayUser?.full_name}</Text>
              <Text style={styles.email}>{displayUser?.email}</Text>
              {displayUser?.phone ? <Text style={styles.phone}>{displayUser.phone}</Text> : null}
              <View style={{ marginTop: 8 }}>
                <StatusBadge label={isDriver ? 'Driver' : 'Parent'} tone={isDriver ? 'driver' : 'parent'} />
              </View>
            </View>
          </View>
          <Pressable style={[styles.editBtn, { borderColor: `${accent}55`, backgroundColor: `${accent}10` }]} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={18} color={accent} />
            <Text style={[styles.editBtnText, { color: accent }]}>Edit profile</Text>
          </Pressable>
        </Card>

        {isDriver && driverProfile.isLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : null}

        {isDriver && driverProfile.data ? (
          <Card>
            <Text style={styles.blockTitle}>Driver details</Text>
            <ListRow title="Employee ID" subtitle={driverProfile.data.driver.employee_id} icon="id-card-outline" iconAccent={RoleAccents.driver} />
            <ListRow title="Phone" subtitle={driverProfile.data.driver.phone ?? '—'} icon="call-outline" iconAccent={RoleAccents.driver} />
            <ListRow title="License" subtitle={`${driverProfile.data.driver.license_class} · ${driverProfile.data.driver.license_number}`} icon="card-outline" iconAccent={RoleAccents.driver} />
            <ListRow
              title="Default vehicle"
              subtitle={driverProfile.data.driver.default_vehicle?.vehicle_number ?? 'Not assigned'}
              icon="bus-outline"
              iconAccent={RoleAccents.driver}
            />
            <ListRow title="Assigned students" subtitle={`${driverProfile.data.stats.assigned_students} active`} icon="people-outline" iconAccent={RoleAccents.driver} />
          </Card>
        ) : null}

        <Card>
          <Text style={styles.blockTitle}>Preferences</Text>
          <ListRow
            title="Push notifications"
            subtitle="Delays, pickups, and route updates"
            icon="notifications-outline"
            onPress={() => showSweetAlert({ type: 'info', title: 'Notifications', message: 'Push notifications are enabled for route updates and delays.' })}
          />
          <ListRow
            title="SMS alerts"
            subtitle="Enabled for critical delays"
            icon="chatbubble-ellipses-outline"
            onPress={() => showSweetAlert({ type: 'info', title: 'SMS alerts', message: 'Critical delay alerts will be sent via SMS when enabled by your district.' })}
          />
          <ListRow title="Organization" subtitle={user?.organization?.name ?? '—'} icon="business-outline" />
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Support & legal</Text>
          <ListRow
            title="Help & support"
            subtitle="Contact dispatch, FAQs, and app help"
            icon="headset-outline"
            onPress={() => router.push('/support')}
          />
          <ListRow
            title="Privacy Policy"
            subtitle="How we handle your personal data"
            icon="shield-checkmark-outline"
            onPress={() => router.push({ pathname: '/legal/[document]', params: { document: 'privacy' } })}
          />
          <ListRow
            title="Terms of Service"
            subtitle="App usage terms and conditions"
            icon="document-text-outline"
            onPress={() => router.push({ pathname: '/legal/[document]', params: { document: 'terms' } })}
          />
          <ListRow title="App version" subtitle="1.0.0 · FleetPilot Mobile" icon="information-circle-outline" />
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Account</Text>
          <ListRow
            title="Delete account"
            subtitle="Permanently remove your app access and data"
            icon="trash-outline"
            iconAccent={Colors.danger}
            onPress={() => router.push('/delete-account')}
          />
        </Card>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 14 },
  hero: { padding: 18 },
  heroRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.secondary },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  phone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  editBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  editBtnText: { fontSize: 14, fontWeight: '700' },
  blockTitle: { fontSize: 13, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase', marginBottom: 4 },
  logout: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});
