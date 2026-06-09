import { Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { TabIcon } from '@/components/ui/tab-icon';
import { fetchMobileNotifications } from '@/lib/mobile-api';
import { fetchChatConversations } from '@/lib/chat-api';
import { useAuthStore } from '@/store/auth';

export default function TabLayout() {
  const role = useAuthStore((s) => s.user?.role);
  const isDriver = role === 'driver';
  const isParent = role === 'parent';
  const notifications = useQuery({ queryKey: ['mobile-notifications'], queryFn: fetchMobileNotifications });
  const chat = useQuery({ queryKey: ['chat-conversations'], queryFn: fetchChatConversations });
  const unreadAlerts = notifications.data?.unread ?? 0;
  const unreadMessages = chat.data?.unread_total ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          href: isDriver ? undefined : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="today" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          href: isDriver ? undefined : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="calendar" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: isParent ? undefined : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          href: isParent ? undefined : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="navigate" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 9 ? '9+' : unreadMessages) : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon name="messages" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: unreadAlerts > 0 ? (unreadAlerts > 9 ? '9+' : unreadAlerts) : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon name="notifications" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="person" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
