import { useState } from 'react';
import { Colors } from '@/constants/theme';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '@/lib/auth-api';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const demoAccounts = [
  { label: 'Driver', email: 'driver@fleetpilot.test' },
  { label: 'Parent', email: 'parent@fleetpilot.test' },
  { label: 'Dispatcher', email: 'dispatch@fleetpilot.test' },
  { label: 'Admin', email: 'admin@fleetpilot.test' },
];

export function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      await setSession(res.access_token, res.user);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.errors ? Object.values(e.errors)[0]?.[0] ?? e.message : e.message);
      } else {
        setError('Unable to connect. Check your network and API URL.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FP</Text>
          </View>
          <Text style={styles.title}>FleetPilot</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@district.org"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <Text style={styles.demoLabel}>Demo accounts (password: password)</Text>
          <View style={styles.demoGrid}>
            {demoAccounts.map((acc) => (
              <Pressable key={acc.email} style={styles.demoChip} onPress={() => fillDemo(acc.email)}>
                <Text style={styles.demoChipText}>{acc.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundElement },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingTop: 48, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logoBox: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  title: { textAlign: 'center', fontSize: 26, fontWeight: '700', color: Colors.secondary },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary,
    backgroundColor: '#fff',
  },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  demoLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 28,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  demoChip: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  demoChipText: { color: '#334155', fontSize: 14, fontWeight: '500' },
});
