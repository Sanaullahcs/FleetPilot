import { Platform } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

/** Minimum space above the iOS home indicator / Android nav bar when insets report 0. */
const MIN_BOTTOM_INSET = Platform.select({ ios: 34, android: 24, default: 12 }) ?? 12;

export function getEffectiveBottomInset(insets: EdgeInsets): number {
  const reported = Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0);
  return Math.max(reported, MIN_BOTTOM_INSET);
}

export function useEffectiveBottomInset(): number {
  const insets = useSafeAreaInsets();
  return getEffectiveBottomInset(insets);
}
