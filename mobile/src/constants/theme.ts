/** FleetPilot brand palette — mirrors web/src/lib/brand.ts */

export const Colors = {
  primary: '#4F5BA9',
  primaryDark: '#3D4587',
  primaryLight: '#EEF0F9',
  accent: '#0EA5E9',
  accentLight: '#E0F2FE',
  accentDark: '#0284C7',
  cyan: '#06B6D4',
  cyanLight: '#CFFAFE',
  orange: '#F97316',
  orangeLight: '#FFEDD5',
  secondary: '#18181B',
  text: '#18181B',
  textSecondary: '#52525B',
  textMuted: '#64748B',
  label: '#334155',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  surface: '#FFFFFF',
  background: '#FFFFFF',
  backgroundElement: '#F4F5FA',
  backgroundAuth: '#F8F9FC',
  backgroundSelected: '#E4E4E7',
  backgroundMuted: '#F8FAFC',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',
} as const;

export type ThemeColor = keyof typeof Colors;

export const RoleAccents = {
  admin: Colors.primary,
  dispatcher: Colors.cyan,
  driver: Colors.accent,
  parent: Colors.orange,
} as const;

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

export const Radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 24,
  card: 24,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#4F5BA9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const MaxContentWidth = 800;
