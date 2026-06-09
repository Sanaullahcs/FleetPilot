import { Ionicons, type IconName } from '@/components/ui/icons';
import type { ColorValue } from 'react-native';

type TabIconName = 'today' | 'calendar' | 'home' | 'navigate' | 'messages' | 'notifications' | 'person';

const iconMap: Record<TabIconName, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
  today: { outline: 'today-outline', filled: 'today' },
  calendar: { outline: 'calendar-clear-outline', filled: 'calendar-clear' },
  home: { outline: 'home-outline', filled: 'home' },
  navigate: { outline: 'locate-outline', filled: 'locate' },
  messages: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  notifications: { outline: 'notifications-outline', filled: 'notifications' },
  person: { outline: 'person-outline', filled: 'person' },
};

export function TabIcon({ name, color, focused }: { name: TabIconName; color: ColorValue; focused: boolean }) {
  const icon = focused ? iconMap[name].filled : iconMap[name].outline;
  return <Ionicons name={icon} size={21} color={color} />;
}
