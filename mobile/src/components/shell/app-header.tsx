import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FleetPilotLogoMark } from '@/components/brand/logo-mark';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export function AppHeader({
  title,
  subtitle,
  unread = 0,
  onAlertsPress,
  onBackPress,
}: {
  title: string;
  subtitle?: string;
  unread?: number;
  onAlertsPress?: () => void;
  onBackPress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {onBackPress ? (
          <Pressable style={styles.backBtn} onPress={onBackPress} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.secondary} />
          </Pressable>
        ) : (
          <FleetPilotLogoMark size={38} />
        )}
        <View style={styles.textCol}>
          <Text style={styles.greeting}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle ?? user?.organization?.name ?? 'FleetPilot'}</Text>
        </View>
        {onAlertsPress ? (
          <Pressable style={styles.bell} onPress={onAlertsPress}>
            <Ionicons name="notifications-outline" size={20} color={Colors.secondary} />
            {unread > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textCol: { flex: 1 },
  greeting: { fontSize: 20, fontWeight: '800', color: Colors.secondary, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
});
