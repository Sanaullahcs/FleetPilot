import type { EdgeInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { getEffectiveBottomInset } from '@/hooks/use-effective-bottom-inset';

/** Visible tab row height (icons + labels), excluding the system safe area. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export function tabBarMetrics(insets: EdgeInsets) {
  const safeBottom = getEffectiveBottomInset(insets);
  return {
    contentHeight: TAB_BAR_CONTENT_HEIGHT,
    safeBottom,
    totalHeight: TAB_BAR_CONTENT_HEIGHT + safeBottom,
  };
}

export function tabBarStyle(insets: EdgeInsets) {
  const { safeBottom, totalHeight } = tabBarMetrics(insets);
  return {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: totalHeight,
    paddingTop: 8,
    paddingBottom: safeBottom,
    elevation: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 } as const,
    shadowOpacity: 0.1,
    shadowRadius: 14,
  };
}
