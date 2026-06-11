import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { TabIcon } from '@/components/ui/tab-icon';
import { ChatMessageBannerHost } from '@/components/chat/chat-message-banner';
import { fetchMobileNotifications } from '@/lib/mobile-api';
import { fetchChatConversations } from '@/lib/chat-api';
import { useChatMessageNotifications } from '@/hooks/use-chat-message-notifications';
import { useAuthStore } from '@/store/auth';
import { getMobileRole } from '@/constants/app';
import { tabBarStyle } from '@/components/shell/tab-bar-styles';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const mobileRole = getMobileRole(user);
  const isAuthed = !!(token && user && mobileRole);
  const isDriver = mobileRole === 'driver';
  const isParent = mobileRole === 'parent';

  const notifications = useQuery({
    queryKey: ['mobile-notifications'],
    queryFn: fetchMobileNotifications,
    enabled: isAuthed,
    refetchInterval: isAuthed ? 8_000 : false,
  });
  const chat = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchChatConversations,
    enabled: isAuthed,
    refetchInterval: isAuthed ? 4_000 : false,
  });
  useChatMessageNotifications(isAuthed);
  const unreadAlerts = notifications.data?.unread ?? 0;
  const unreadMessages = chat.data?.unread_total ?? 0;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundElement }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthed) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <>
      <ChatMessageBannerHost />
      <Tabs
      key={mobileRole}
      initialRouteName={isDriver ? 'today' : 'home'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: tabBarStyle(insets),
        tabBarItemStyle: { paddingTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          href: isDriver ? '/today' : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="today" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          href: isDriver ? '/schedule' : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="calendar" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: isParent ? '/home' : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          href: isParent ? '/track' : null,
          tabBarIcon: ({ color, focused }) => <TabIcon name="navigate" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          href: '/messages',
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 9 ? '9+' : unreadMessages) : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon name="messages" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          href: '/alerts',
          tabBarBadge: unreadAlerts > 0 ? (unreadAlerts > 9 ? '9+' : unreadAlerts) : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon name="notifications" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="person" color={color} focused={focused} />,
        }}
      />
    </Tabs>
    </>
  );
}
