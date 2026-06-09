import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { Card } from '@/components/ui/primitives';
import { IconListItem } from '@/components/ui/icon-list-item';
import { ui } from '@/constants/ui-styles';
import { Colors } from '@/constants/theme';
import { deleteAccount } from '@/lib/auth-api';
import { ApiError } from '@/lib/api';
import { showConfirmAlert, showSweetAlert } from '@/store/sweet-alert';
import { useAuthStore } from '@/store/auth';

export function DeleteAccountScreen() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length > 0 && confirmation === 'DELETE' && !submitting;

  const onDelete = () => {
    showConfirmAlert(
      'Delete account permanently?',
      'This cannot be undone. You will lose app access immediately.',
      async () => {
        setError(null);
        setSubmitting(true);
        try {
          await deleteAccount(password);
          await clear();
          showSweetAlert({ type: 'success', title: 'Account deleted', message: 'Your account has been permanently removed.' });
        } catch (e) {
          if (e instanceof ApiError) {
            setError(e.errors ? Object.values(e.errors)[0]?.[0] ?? e.message : e.message);
            showSweetAlert({ type: 'error', title: 'Deletion failed', message: e.message });
          } else {
            setError('Unable to delete account. Check your connection and try again.');
            showSweetAlert({ type: 'error', title: 'Deletion failed', message: 'Check your connection and try again.' });
          }
        } finally {
          setSubmitting(false);
        }
      },
      { confirmText: 'Delete account' },
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Delete account" subtitle="Permanent account removal" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.warning}>
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={22} color={Colors.danger} />
            <Text style={styles.warningTitle}>This action is permanent</Text>
          </View>
          <Text style={styles.warningText}>
            Deleting removes login access for {user?.email}. Your district may retain transportation records required by
            law.
          </Text>
        </Card>

        <Card style={styles.listCard}>
          <Text style={styles.listTitle}>What will be removed</Text>
          <View style={styles.list}>
            <IconListItem icon="key-outline" label="Login credentials and app access" accent={Colors.danger} />
            <IconListItem icon="notifications-outline" label="Push notification registrations" accent={Colors.danger} />
            <IconListItem icon="people-outline" label="Parent–student links (parent accounts)" accent={Colors.danger} />
            <IconListItem icon="person-outline" label="Personal contact details in the app profile" accent={Colors.danger} />
          </View>
        </Card>

        <Card>
          <Text style={styles.fieldLabel}>Confirm your password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor={Colors.placeholder}
            style={ui.input}
          />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Type DELETE to confirm</Text>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            placeholder="DELETE"
            placeholderTextColor={Colors.placeholder}
            style={ui.input}
          />
          {error ? (
            <View style={[ui.errorBanner, { marginTop: 12 }]}>
              <Text style={ui.errorBannerText}>{error}</Text>
            </View>
          ) : null}
        </Card>

        <Pressable
          style={[styles.deleteBtn, !canSubmit && styles.deleteBtnDisabled]}
          onPress={onDelete}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={Colors.white} />
              <Text style={styles.deleteBtnText}>Delete my account</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => router.push({ pathname: '/legal/[document]', params: { document: 'account-deletion' } })}>
          <Text style={styles.policyLink}>Read the full Account Deletion Policy</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 14 },
  warning: { backgroundColor: Colors.dangerLight, borderColor: Colors.dangerBorder, gap: 10 },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  warningTitle: { fontSize: 15, fontWeight: '800', color: Colors.danger },
  warningText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  listCard: { gap: 12 },
  listTitle: { fontSize: 13, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase' },
  list: { gap: 10 },
  fieldLabel: { ...ui.label, marginBottom: 8 },
  policyLink: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
