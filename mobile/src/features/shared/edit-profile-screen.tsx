import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { KeyboardFormScreen } from '@/components/ui/keyboard-form-screen';
import { Card, PrimaryButton } from '@/components/ui/primitives';
import { Colors, RoleAccents } from '@/constants/theme';
import { ui } from '@/constants/ui-styles';
import { fetchMe, updateProfile } from '@/lib/auth-api';
import { RELATIONSHIP_OPTIONS } from '@/lib/auth-signup';
import { ApiError } from '@/lib/api';
import { fetchDriverProfile, fetchParentProfile, updateDriverProfile, updateParentProfile } from '@/lib/mobile-api';
import { US_STATES } from '@/lib/us-states';
import { useAuthStore } from '@/store/auth';
import { showSweetAlert } from '@/store/sweet-alert';

type PickerKind = 'relationship' | 'state' | null;

export function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isDriver = storedUser?.role === 'driver';
  const accent = isDriver ? RoleAccents.driver : RoleAccents.parent;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);

  const me = useQuery({ queryKey: ['auth-me'], queryFn: fetchMe });
  const driverProfile = useQuery({
    queryKey: ['driver-profile'],
    queryFn: fetchDriverProfile,
    enabled: isDriver,
  });
  const parentProfile = useQuery({
    queryKey: ['parent-profile'],
    queryFn: fetchParentProfile,
    enabled: !isDriver,
  });

  useEffect(() => {
    const user = me.data ?? storedUser;
    if (!user) return;
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setAddress(user.address ?? '');
    setCity(user.city ?? '');
    setState(user.state ?? '');
    setZip(user.zip ?? '');
  }, [me.data, storedUser]);

  useEffect(() => {
    if (driverProfile.data?.driver) {
      const driver = driverProfile.data.driver;
      setEmergencyName(driver.emergency_contact_name ?? '');
      setEmergencyPhone(driver.emergency_contact_phone ?? '');
      if (!phone && driver.phone) setPhone(driver.phone);
    }
  }, [driverProfile.data]);

  useEffect(() => {
    if (parentProfile.data?.parent) {
      const parent = parentProfile.data.parent;
      setRelationship(parent.relationship ?? '');
      setPreferredLanguage(parent.preferred_language ?? 'en');
      const prefs = parent.notification_preferences;
      if (prefs) {
        setNotifyPush(prefs.push ?? true);
        setNotifySms(prefs.sms ?? true);
        setNotifyEmail(prefs.email ?? true);
      }
    }
    if (parentProfile.data?.user && !me.data) {
      const user = parentProfile.data.user;
      setPhone(user.phone ?? '');
      setAddress(user.address ?? '');
      setCity(user.city ?? '');
      setState(user.state ?? '');
      setZip(user.zip ?? '');
    }
  }, [parentProfile.data, me.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        throw new Error('First name, last name, and email are required.');
      }
      if (password && password !== passwordConfirmation) {
        throw new Error('Passwords do not match.');
      }
      if (password && password.length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }

      const updatedUser = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        ...(password ? { password, password_confirmation: passwordConfirmation } : {}),
      });

      if (isDriver) {
        await updateDriverProfile({
          phone: phone.trim() || null,
          emergency_contact_name: emergencyName.trim() || null,
          emergency_contact_phone: emergencyPhone.trim() || null,
        });
      } else {
        await updateParentProfile({
          relationship: relationship || null,
          preferred_language: preferredLanguage.trim() || 'en',
          notification_preferences: {
            push: notifyPush,
            sms: notifySms,
            email: notifyEmail,
          },
        });
      }

      return updatedUser;
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      queryClient.invalidateQueries({ queryKey: ['parent-profile'] });
      showSweetAlert({ type: 'success', title: 'Profile saved', message: 'Your changes have been updated.' });
      router.back();
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not save profile.';
      setError(message);
    },
  });

  const loading = me.isLoading || (isDriver ? driverProfile.isLoading : parentProfile.isLoading);
  const relationshipLabel = RELATIONSHIP_OPTIONS.find((r) => r.value === relationship)?.label ?? 'Select relationship';
  const stateLabel = US_STATES.find((s) => s.value === state)?.label ?? 'Select state';

  return (
    <View style={styles.root}>
      <AppHeader title="Edit profile" subtitle="Update your account details" onBackPress={() => router.back()} />
      <KeyboardFormScreen scrollRef={scrollRef} contentContainerStyle={styles.scroll}>
        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : null}

        {error ? (
          <View style={ui.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={ui.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <Field label="First name" value={firstName} onChangeText={setFirstName} />
          <Field label="Last name" value={lastName} onChangeText={setLastName} />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <Field label="Street address" value={address} onChangeText={setAddress} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Text style={ui.label}>State</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setPicker('state')}>
            <Text style={styles.pickerText}>{state ? `${stateLabel} (${state})` : 'Select state'}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.placeholder} />
          </Pressable>
          <Field label="ZIP code" value={zip} onChangeText={setZip} keyboardType="number-pad" />
        </Card>

        {isDriver ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency contact</Text>
            <Field label="Contact name" value={emergencyName} onChangeText={setEmergencyName} />
            <Field label="Contact phone" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
          </Card>
        ) : (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Parent details</Text>
            <Text style={ui.label}>Relationship</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setPicker('relationship')}>
              <Text style={styles.pickerText}>{relationshipLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.placeholder} />
            </Pressable>
            <Field label="Preferred language" value={preferredLanguage} onChangeText={setPreferredLanguage} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Push notifications</Text>
              <Switch value={notifyPush} onValueChange={setNotifyPush} trackColor={{ true: accent }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>SMS alerts</Text>
              <Switch value={notifySms} onValueChange={setNotifySms} trackColor={{ true: accent }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Email updates</Text>
              <Switch value={notifyEmail} onValueChange={setNotifyEmail} trackColor={{ true: accent }} />
            </View>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Change password</Text>
          <Text style={styles.sectionHint}>Leave blank to keep your current password</Text>
          <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
          <Field label="Confirm password" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />
        </Card>

        <PrimaryButton
          label={save.isPending ? 'Saving…' : 'Save changes'}
          icon="checkmark-circle"
          onPress={() => save.mutate()}
          disabled={save.isPending}
        />
      </KeyboardFormScreen>

      {picker ? (
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setPicker(null)} />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>{picker === 'state' ? 'Select state' : 'Relationship'}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {(picker === 'state'
                ? US_STATES.map((item) => ({ value: item.value, label: item.label }))
                : RELATIONSHIP_OPTIONS.map((item) => ({ value: item.value, label: item.label }))
              ).map((item) => (
                <Pressable
                  key={item.value}
                  style={styles.pickerOption}
                  onPress={() => {
                    if (picker === 'state') setState(item.value);
                    else setRelationship(item.value);
                    setPicker(null);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={ui.input}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 14 },
  section: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase', marginBottom: 8 },
  sectionHint: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  pickerText: { fontSize: 16, color: Colors.secondary },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  switchLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  pickerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 20 },
  pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '60%',
  },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: Colors.secondary, marginBottom: 12 },
  pickerOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerOptionText: { fontSize: 16, color: Colors.textSecondary },
});
