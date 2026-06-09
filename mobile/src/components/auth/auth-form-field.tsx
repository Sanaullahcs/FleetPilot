import { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';

export function AuthFormField({
  label,
  error,
  compact,
  children,
  style,
}: {
  label: string;
  error?: string | null;
  compact?: boolean;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const hasError = Boolean(error);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>
      {children}
      {hasError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function authInputStyle(hasError: boolean) {
  return hasError ? styles.inputInvalid : undefined;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  wrapCompact: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.label, marginBottom: 5 },
  labelError: { color: Colors.danger },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 5 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 16, color: Colors.danger, fontWeight: '500' },
  inputInvalid: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
});
