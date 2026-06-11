import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppHeader } from '@/components/shell/app-header';
import { EmptyState, PressableCard, SectionHeader } from '@/components/ui/primitives';
import { PhotoAvatar } from '@/components/ui/photo-avatar';
import { Colors } from '@/constants/theme';
import { fetchChatConversations } from '@/lib/chat-api';
import type { ChatAvatarType, ChatConversation } from '@/lib/chat-types';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { useAuthStore } from '@/store/auth';

function avatarVariant(type: ChatAvatarType): 'person' | 'bus' | 'school' {
  if (type === 'driver') return 'bus';
  if (type === 'school') return 'school';
  return 'person';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationRow({ item, onPress }: { item: ChatConversation; onPress: () => void }) {
  return (
    <PressableCard onPress={onPress} style={styles.row}>
      <View style={styles.rowInner}>
        <PhotoAvatar name={item.title} variant={avatarVariant(item.avatar_type)} size={52} seed={item.id} />
        <View style={styles.rowText}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
            {item.last_message ? (
              <Text style={styles.rowTime}>{formatTime(item.last_message.time)}</Text>
            ) : null}
          </View>
          {item.subtitle ? <Text style={styles.rowSub} numberOfLines={1}>{item.subtitle}</Text> : null}
          {item.last_message ? (
            <Text style={styles.rowPreview} numberOfLines={1}>
              {item.last_message.is_mine ? 'You: ' : ''}{item.last_message.body}
            </Text>
          ) : (
            <Text style={styles.rowPreviewMuted}>Start a conversation</Text>
          )}
        </View>
        {item.unread_count > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
          </View>
        ) : null}
      </View>
    </PressableCard>
  );
}

export function MessagesScreen() {
  const tabBarInset = useTabBarInset();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDriver = user?.role === 'driver';
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const conversations = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchChatConversations,
    refetchInterval: 5_000,
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }, [queryClient]),
  );

  const openThread = (id: string) => {
    router.push({ pathname: '/chat/[conversationId]', params: { conversationId: id } });
  };

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await conversations.refetch();
    } finally {
      setPullRefreshing(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title="Messages"
        subtitle={isDriver ? 'Parents on your route & dispatch support' : 'Drivers, school & support'}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset + 16 }]}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}
      >
        <SectionHeader
          title="Conversations"
          subtitle={
            isDriver
              ? 'Chat with parents on your route and dispatch support'
              : 'Message your driver, school office, or FleetPilot support'
          }
        />

        {conversations.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
        ) : conversations.data?.items.length ? (
          conversations.data.items.map((item) => (
            <ConversationRow key={item.id} item={item} onPress={() => openThread(item.id)} />
          ))
        ) : (
          <EmptyState
            title="No conversations yet"
            message="Your message threads will appear here once connected."
            icon="chatbubbles-outline"
          />
        )}

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>Need urgent help?</Text>
          <Pressable onPress={() => router.push('/support')}>
            <Text style={styles.tipLink}>Open support center for phone & FAQ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 32, gap: 10 },
  row: { marginBottom: 0 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.secondary },
  rowTime: { fontSize: 11, color: Colors.placeholder, fontWeight: '600' },
  rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowPreview: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  rowPreviewMuted: { fontSize: 13, color: Colors.placeholder, marginTop: 4, fontStyle: 'italic' },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  tip: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: `${Colors.primary}22`,
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tipLink: { fontSize: 13, color: Colors.primaryDark, marginTop: 6, fontWeight: '600' },
});
