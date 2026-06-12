import { useEffectiveBottomInset } from '@/hooks/use-effective-bottom-inset';
import { TAB_BAR_CONTENT_HEIGHT } from '@/components/shell/tab-bar-styles';

/** Bottom inset consumed by the tab bar (content + system safe area). */
export function useTabBarInset() {
  const bottomSafe = useEffectiveBottomInset();
  return TAB_BAR_CONTENT_HEIGHT + bottomSafe;
}

export function useTabBarPadding() {
  return useEffectiveBottomInset();
}
