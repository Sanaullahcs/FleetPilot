import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

type PhotoAvatarProps = {
  name: string;
  size?: number;
  seed?: string;
  variant?: 'person' | 'bus' | 'school';
};

function avatarUrl(name: string, seed?: string, variant: PhotoAvatarProps['variant'] = 'person') {
  const key = encodeURIComponent(seed ?? name);
  if (variant === 'bus') {
    return `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&h=200&fit=crop&crop=center`;
  }
  if (variant === 'school') {
    return `https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=200&fit=crop&crop=center`;
  }
  return `https://api.dicebear.com/7.x/notionists/png?seed=${key}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=200`;
}

export function PhotoAvatar({ name, size = 48, seed, variant = 'person' }: PhotoAvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 3.2 }]}>
      <Image
        source={{ uri: avatarUrl(name, seed, variant) }}
        style={{ width: size, height: size, borderRadius: size / 3.2 }}
        contentFit="cover"
        transition={200}
      />
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 3.2 }]}>
        <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.surface, backgroundColor: Colors.primaryLight },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    opacity: 0,
  },
  initials: { fontWeight: '800', color: Colors.primary },
});
