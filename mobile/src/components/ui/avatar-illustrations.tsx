import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { UserGender } from '@/lib/avatar-url';

export type IllustrationGender = 'male' | 'female' | 'neutral';

export function resolveIllustrationGender(gender?: UserGender | null): IllustrationGender {
  if (gender === 'male') return 'male';
  if (gender === 'female') return 'female';
  return 'neutral';
}

export function AvatarIllustration({
  gender,
  accent = '#4F5BA9',
  size,
}: {
  gender: IllustrationGender;
  accent?: string;
  size: number;
}) {
  const light = 'rgba(255,255,255,0.92)';
  const soft = 'rgba(255,255,255,0.55)';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accent} />
          <Stop offset="1" stopColor={accent} stopOpacity="0.75" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#avatarBg)" />
      <Ellipse cx="50" cy="88" rx="36" ry="18" fill={soft} />
      <Circle cx="50" cy="38" r="18" fill={light} />
      {gender === 'male' ? (
        <Path d="M32 36 Q32 22 50 20 Q68 22 68 36 L68 42 Q50 46 32 42 Z" fill={soft} />
      ) : null}
      {gender === 'female' ? (
        <Path d="M30 38 Q30 18 50 16 Q70 18 70 38 L72 54 Q50 60 28 54 Z" fill={soft} />
      ) : null}
      {gender === 'neutral' ? (
        <Path d="M32 34 Q32 22 50 20 Q68 22 68 34 Q68 40 50 42 Q32 40 32 34 Z" fill={soft} />
      ) : null}
    </Svg>
  );
}
