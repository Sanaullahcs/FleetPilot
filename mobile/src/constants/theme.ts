/** FleetPilot mobile theme — light mode only. Primary #4F5BA9 · Secondary #18181B */

export const Colors = {
  primary: '#4F5BA9',
  primaryDark: '#3D4587',
  primaryLight: '#EEF0F9',
  secondary: '#18181B',
  accent: '#0EA5E9',
  accentLight: '#E0F2FE',
  accentDark: '#0284C7',
  text: '#18181B',
  textSecondary: '#52525B',
  background: '#FFFFFF',
  backgroundElement: '#F4F5FA',
  backgroundSelected: '#E4E4E7',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = {
  sans: 'system-ui',
  mono: 'monospace',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
