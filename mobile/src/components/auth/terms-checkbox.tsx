import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';

export function TermsCheckbox({
  checked,
  onToggle,
  accent,
  onOpenPrivacy,
  onOpenTerms,
  error,
}: {
  checked: boolean;
  onToggle: () => void;
  accent?: string;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  error?: string;
}) {
  const activeColor = accent ?? Colors.primary;
  const hasError = Boolean(error);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.row} onPress={onToggle}>
        <View
          style={[
            styles.box,
            checked && { backgroundColor: activeColor, borderColor: activeColor },
            hasError && !checked && styles.boxError,
          ]}
        >
          {checked ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
        </View>
        <Text style={styles.text}>
          I agree to the{' '}
          <Text
            style={styles.link}
            onPress={() => {
              onOpenTerms?.();
            }}
          >
            Terms & Conditions
          </Text>
          {' '}and{' '}
          <Text
            style={styles.link}
            onPress={() => {
              onOpenPrivacy?.();
            }}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Pressable>
      {hasError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: Colors.surface,
  },
  boxError: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 6, paddingLeft: 34 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 16, color: Colors.danger, fontWeight: '500' },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
