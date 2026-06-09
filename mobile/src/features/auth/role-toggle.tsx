import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';
import type { MobileRole } from '@/constants/app';
import { ROLE_PORTALS } from '@/features/auth/role-portals';

const order: MobileRole[] = ['driver', 'parent'];

export function RoleToggle({ role, onChange }: { role: MobileRole; onChange: (next: MobileRole) => void }) {
  return (
    <View style={styles.wrap}>
      {order.map((item) => {
        const config = ROLE_PORTALS[item];
        const active = role === item;
        return (
          <Pressable
            key={item}
            style={[
              styles.option,
              active && { borderColor: config.accent, backgroundColor: `${config.accent}10` },
            ]}
            onPress={() => onChange(item)}
          >
            <Ionicons name={config.outlineIcon} size={18} color={active ? config.accent : Colors.placeholder} />
            <Text style={[styles.optionText, active && { color: config.accent, fontWeight: '700' }]}>
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
