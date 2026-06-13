import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useState } from 'react';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/shell/app-header';

import { EmptyState, PressableCard, SectionHeader } from '@/components/ui/primitives';

import { PhotoAvatar } from '@/components/ui/photo-avatar';

import { Colors } from '@/constants/theme';

import { fetchChatConversations, groupDriverConversations, groupParentConversations } from '@/lib/chat-api';

import type { ChatAvatarType, ChatConversation } from '@/lib/chat-types';

import { useTabBarInset } from '@/hooks/use-tab-bar-inset';

import { useAuthStore } from '@/store/auth';

import { getMobileRole } from '@/constants/app';

import { getQueryErrorMessage } from '@/lib/query-utils';



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

  const token = useAuthStore((s) => s.token);

  const user = useAuthStore((s) => s.user);

  const mobileRole = getMobileRole(user);

  const router = useRouter();

  const queryClient = useQueryClient();

  const isDriver = mobileRole === 'driver';

  const [pullRefreshing, setPullRefreshing] = useState(false);



  const conversations = useQuery({

    queryKey: ['chat-conversations'],

    queryFn: fetchChatConversations,

    enabled: !!token && !!mobileRole,

    refetchInterval: 12_000,

    placeholderData: keepPreviousData,

    staleTime: 8_000,

  });



  const openThread = (id: string) => {

    router.push({ pathname: '/chat/[conversationId]', params: { conversationId: id } });

  };



  const onRefresh = async () => {

    setPullRefreshing(true);

    try {

      await queryClient.fetchQuery({

        queryKey: ['chat-conversations'],

        queryFn: fetchChatConversations,

      });

    } finally {

      setPullRefreshing(false);

    }

  };



  const initialLoading = conversations.isPending && !conversations.data;

  const items = conversations.data?.items ?? [];
  const parentGroups = !isDriver ? groupParentConversations(items) : null;
  const driverGroups = isDriver ? groupDriverConversations(items) : null;

  const renderList = () => {
    if (isDriver) {
      const sections: { key: string; title: string; subtitle: string; data: ChatConversation[] }[] = [
        {
          key: 'support',
          title: 'Dispatch & support',
          subtitle: 'Route help, delays, and app support',
          data: driverGroups!.support,
        },
        {
          key: 'parent',
          title: 'Parents',
          subtitle: 'Families on your assigned routes',
          data: driverGroups!.parent,
        },
        {
          key: 'school',
          title: 'Schools',
          subtitle: 'Pickup, dismissal, and office coordination',
          data: driverGroups!.school,
        },
        {
          key: 'contractor',
          title: 'Contractor',
          subtitle: 'Messages from your fleet contractor',
          data: driverGroups!.contractor,
        },
      ];

      const visible = sections.filter((s) => s.data.length > 0);
      if (!visible.length) return null;

      return visible.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSub}>{section.subtitle}</Text>
          {section.data.map((item) => (
            <ConversationRow key={item.id} item={item} onPress={() => openThread(item.id)} />
          ))}
        </View>
      ));
    }

    const sections: { key: string; title: string; subtitle: string; data: ChatConversation[] }[] = [
      {
        key: 'support',
        title: 'Transportation office',
        subtitle: 'Dispatch & route help from your district',
        data: parentGroups!.support,
      },
      {
        key: 'driver',
        title: 'Drivers',
        subtitle: "Your child's bus driver on each route",
        data: parentGroups!.driver,
      },
      {
        key: 'school',
        title: 'Schools',
        subtitle: 'Absences, enrollment, and school office',
        data: parentGroups!.school,
      },
    ];

    const visible = sections.filter((s) => s.data.length > 0);
    if (!visible.length) return null;

    return visible.map((section) => (
      <View key={section.key} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionSub}>{section.subtitle}</Text>
        {section.data.map((item) => (
          <ConversationRow key={item.id} item={item} onPress={() => openThread(item.id)} />
        ))}
      </View>
    ));
  };



  return (

    <View style={styles.root}>

      <AppHeader

        title="Messages"

        subtitle={isDriver ? 'Parents, schools & dispatch support' : 'Drivers, school & support'}

      />

      <ScrollView

        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset + 16 }]}

        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}

      >

        <SectionHeader

          title="Conversations"

          subtitle={

            isDriver

              ? 'Chat with parents, school offices, and dispatch support'

              : 'Message your driver, school, or transportation office'

          }

          action={

            conversations.isFetching && !initialLoading ? (

              <ActivityIndicator size="small" color={Colors.primary} />

            ) : null

          }

        />



        {initialLoading ? (

          <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />

        ) : conversations.isError && !items.length ? (

          <EmptyState

            title="Couldn't load messages"

            message={getQueryErrorMessage(conversations.error)}

            icon="cloud-offline-outline"

            accent={Colors.danger}

            actionLabel="Try again"

            onAction={() => void conversations.refetch()}

          />

        ) : items.length ? (
          renderList()
        ) : (

          <EmptyState

            title="No conversations yet"

            message="Pull down to refresh. Transportation, driver, and school threads appear once your account is linked."

            icon="chatbubbles-outline"

            actionLabel="Refresh"

            onAction={() => void onRefresh()}

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
  section: { gap: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.secondary, marginTop: 4 },
  sectionSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },

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


