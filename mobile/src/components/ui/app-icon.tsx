import { Ionicons, type IconName } from '@/components/ui/icons';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';

export type AppIconName = IconName;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  variant?: 'plain' | 'soft' | 'circle';
  accent?: string;
};

export function AppIcon({
  name,
  size = 20,
  color = Colors.secondary,
  variant = 'plain',
  accent = Colors.primary,
}: AppIconProps) {
  const glyph = <Ionicons name={name} size={size} color={color} />;

  if (variant === 'plain') {
    return glyph;
  }

  const box = size + 18;
  return (
    <View
      style={[
        styles.box,
        variant === 'circle' && styles.circle,
        { width: box, height: box, backgroundColor: `${accent}14` },
      ]}
    >
      {glyph}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  circle: {
    borderRadius: 999,
  },
});
