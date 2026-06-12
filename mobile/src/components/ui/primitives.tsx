import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { Ionicons, type IconName } from '@/components/ui/icons';
import { AppIcon } from '@/components/ui/app-icon';
import { Colors, RoleAccents } from '@/constants/theme';

export function PressableCard({
  onPress,
  style,
  children,
  showChevron = true,
}: {
  onPress: () => void;
  style?: ViewProps['style'];
  children: React.ReactNode;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pressableCard, style, pressed && styles.pressableCardPressed]}
      onPress={onPress}
    >
      <View style={styles.pressableInner}>
        <View style={{ flex: 1 }}>{children}</View>
        {showChevron ? <Ionicons name="chevron-forward" size={18} color={Colors.placeholder} /> : null}
      </View>
    </Pressable>
  );
}

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function StatusBadge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'driver' | 'parent' }) {
  const palette = {
    default: { bg: Colors.primaryLight, text: Colors.primary },
    success: { bg: '#DCFCE7', text: '#15803D' },
    warning: { bg: '#FEF3C7', text: '#B45309' },
    info: { bg: Colors.accentLight, text: Colors.accentDark },
    danger: { bg: Colors.dangerLight, text: Colors.danger },
    driver: { bg: `${RoleAccents.driver}18`, text: RoleAccents.driver },
    parent: { bg: `${RoleAccents.parent}18`, text: RoleAccents.parent },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]} onPress={onPress} disabled={disabled}>
      {icon ? <Ionicons name={icon} size={18} color={Colors.white} style={styles.btnIcon} /> : null}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
  accent = Colors.primary,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  icon?: IconName;
  accent?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <AppIcon name={icon} size={28} color={accent} variant="soft" accent={accent} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={[styles.emptyAction, { borderColor: `${accent}44` }]} onPress={onAction}>
          <Text style={[styles.emptyActionText, { color: accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({ name, size = 44, accent = Colors.primary }: { name: string; size?: number; accent?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 3, backgroundColor: `${accent}20` }]}>
      <Text style={[styles.avatarText, { color: accent, fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  meta,
  right,
  onPress,
  icon,
  iconAccent = Colors.primary,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  icon?: IconName;
  iconAccent?: string;
}) {
  return (
    <Pressable style={styles.listRow} onPress={onPress} disabled={!onPress}>
      {icon ? (
        <AppIcon name={icon} size={17} color={iconAccent} variant="soft" accent={iconAccent} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.placeholder} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    position: 'relative',
  },
  pressableCardPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  pressableInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.secondary },
  sectionSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.55 },
  btnIcon: { marginRight: -2 },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.secondary, marginBottom: 6 },
  emptyMessage: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyAction: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  emptyActionText: { fontSize: 14, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listTitle: { fontSize: 15, fontWeight: '600', color: Colors.secondary },
  listSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  listMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
