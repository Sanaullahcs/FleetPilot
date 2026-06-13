import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AvatarIllustration, resolveIllustrationGender } from '@/components/ui/avatar-illustrations';
import { Colors } from '@/constants/theme';
import {
  initialsFromName,
  studentAvatarGradient,
  type UserGender,
} from '@/lib/avatar-url';

type PhotoAvatarProps = {
  name: string;
  size?: number;
  seed?: string;
  gender?: UserGender | null;
  photoUrl?: string | null;
  variant?: 'person' | 'student' | 'bus' | 'school';
};

export function PhotoAvatar({
  name,
  size = 48,
  seed,
  gender,
  photoUrl,
  variant = 'person',
}: PhotoAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = initialsFromName(name);
  const radius = size / 3.2;
  const [from, to] = studentAvatarGradient(seed, name);
  const showPhoto = Boolean(photoUrl) && !failed && variant === 'person';

  if (variant === 'bus') {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&h=200&fit=crop&crop=center' }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
        />
      </View>
    );
  }

  if (variant === 'school') {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=200&fit=crop&crop=center' }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
        />
      </View>
    );
  }

  if (variant === 'student') {
    return (
      <View
        style={[
          styles.initialsWrap,
          { width: size, height: size, borderRadius: radius, backgroundColor: from },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: to, opacity: 0.45 }]} />
        <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
      </View>
    );
  }

  if (showPhoto) {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={{ uri: photoUrl! }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
          contentPosition="top"
          transition={200}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius, overflow: 'hidden' }]}>
      <AvatarIllustration gender={resolveIllustrationGender(gender)} accent={Colors.primary} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.surface,
    backgroundColor: Colors.primaryLight,
  },
  initialsWrap: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontWeight: '800', color: '#fff' },
});
