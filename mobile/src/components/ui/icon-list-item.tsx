import { StyleSheet, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { Colors } from '@/constants/theme';

export function IconListItem({
  icon,
  label,
  accent = Colors.primary,
}: {
  icon: AppIconName;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.row}>
      <AppIcon name={icon} size={16} color={accent} variant="soft" accent={accent} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
