import { StyleSheet } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';

/** Shared UI styles aligned with web dashboard (fp-card, fp-input, fp-auth-btn) */
export const ui = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Shadows.card,
  },
  cardCompact: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.label,
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  ghostButtonText: {
    color: Colors.label,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
  },
});
