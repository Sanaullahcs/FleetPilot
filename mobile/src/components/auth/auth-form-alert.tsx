import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';

/** Form-level alert for server / auth errors (not field validation). */
export function AuthFormAlert({ message }: { message: string }) {
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle" size={18} color={Colors.danger} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, color: '#B91C1C', fontSize: 13, lineHeight: 18, fontWeight: '500' },
});
