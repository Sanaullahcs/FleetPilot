import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { useKeyboardBottomOffset, useKeyboardHeight } from '@/hooks/use-keyboard-inset';
import { Colors } from '@/constants/theme';
import {
  fetchChatConversations,
  fetchChatMessages,
  markChatConversationRead,
  sendChatMessage,
} from '@/lib/chat-api';
import { playMessageReceivedInThread } from '@/lib/message-alert-sound';
import type { ChatMessage } from '@/lib/chat-types';
import { showSweetAlert } from '@/store/sweet-alert';
import { useChatBannerStore } from '@/store/chat-banner';
import { useAuthStore } from '@/store/auth';
import { getQueryErrorMessage } from '@/lib/query-utils';
import { EmptyState } from '@/components/ui/primitives';

const COMPOSER_ESTIMATE = 68;
const MESSAGE_POLL_MS = 2_500;

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.is_system) {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.systemText}>{message.body}</Text>
      </View>
    );
  }

  const mine = message.is_mine;

  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!mine ? <Text style={styles.senderName}>{message.sender.name}</Text> : null}
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{formatMessageTime(message.time)}</Text>
      </View>
    </View>
  );
}

export function ChatThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const keyboardOffset = useKeyboardBottomOffset();
  const composerBottomPad = keyboardHeight > 0 ? 0 : Math.max(insets.bottom, 8);
  const hideBanner = useChatBannerStore((s) => s.hideBanner);

  useEffect(() => {
    hideBanner();
  }, [conversationId, hideBanner]);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const prevMessageIdsRef = useRef<Set<string>>(new Set());
  const threadAlertsReadyRef = useRef(false);
  const initialScrollDoneRef = useRef(false);

  const token = useAuthStore((s) => s.token);

  const conversations = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchChatConversations,
    enabled: !!token,
    refetchInterval: MESSAGE_POLL_MS,
  });

  const conversation = conversations.data?.items.find((c) => c.id === conversationId);

  const messages = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => fetchChatMessages(conversationId!),
    enabled: !!token && !!conversationId,
    refetchInterval: MESSAGE_POLL_MS,
    placeholderData: keepPreviousData,
  });

  const messageList = messages.data ?? [];

  /** Inverted FlatList: newest first so latest messages sit at the bottom. */
  const displayMessages = useMemo(() => [...messageList].reverse(), [messageList]);

  const composerInset = COMPOSER_ESTIMATE + composerBottomPad + keyboardOffset;

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated });
    });
  }, []);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendChatMessage(conversationId!, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', conversationId] });
      const previous = queryClient.getQueryData<ChatMessage[]>(['chat-messages', conversationId]);
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        body,
        is_system: false,
        is_mine: true,
        time: new Date().toISOString(),
        sender: { id: null, name: 'You', role: 'user' },
      };
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', conversationId],
        [...(previous ?? []), optimistic],
      );
      scrollToLatest(true);
      return { previous };
    },
    onError: (_error, body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['chat-messages', conversationId], context.previous);
      }
      setDraft(body);
      showSweetAlert({ type: 'error', title: 'Message failed', message: 'Could not send. Try again.' });
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', conversationId], (current) => {
        const list = current ?? [];
        const withoutTemps = list.filter((m) => !m.id.startsWith('temp-'));
        if (withoutTemps.some((m) => m.id === saved.id)) {
          return withoutTemps;
        }
        return [...withoutTemps, saved];
      });
      scrollToLatest(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
    },
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => scrollToLatest(true));
    return () => sub.remove();
  }, [scrollToLatest]);

  useEffect(() => {
    if (!conversationId) return;

    initialScrollDoneRef.current = false;
    threadAlertsReadyRef.current = false;
    prevMessageIdsRef.current = new Set();

    let cancelled = false;
    void (async () => {
      try {
        await markChatConversationRead(conversationId);
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
          void queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
        }
      } catch {
        /* badge clears on next fetch */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    if (!messageList.length) return;

    const ids = new Set(messageList.map((message) => message.id));

    if (!initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      scrollToLatest(false);
    }

    if (!threadAlertsReadyRef.current) {
      prevMessageIdsRef.current = ids;
      threadAlertsReadyRef.current = true;
      return;
    }

    const incoming = messageList.filter(
      (message) => !prevMessageIdsRef.current.has(message.id) && !message.is_mine && !message.is_system,
    );

    if (incoming.length > 0) {
      playMessageReceivedInThread();
      scrollToLatest(true);
    } else if (messageList.some((m) => m.id.startsWith('temp-') && !prevMessageIdsRef.current.has(m.id))) {
      scrollToLatest(true);
    } else if (ids.size > prevMessageIdsRef.current.size) {
      scrollToLatest(true);
    }

    prevMessageIdsRef.current = ids;
  }, [messageList, conversationId, scrollToLatest]);

  const onSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !conversationId || sendMutation.isPending) return;
    setSending(true);
    setDraft('');
    try {
      await sendMutation.mutateAsync(body);
    } finally {
      setSending(false);
    }
  }, [draft, conversationId, sendMutation]);

  return (
    <View style={styles.root}>
      <AppHeader
        title={conversation?.title ?? 'Conversation'}
        subtitle={conversation?.subtitle ?? 'Loading…'}
        onBackPress={() => router.back()}
      />

      <View style={styles.body}>
        {messages.isLoading && !messages.data ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : messages.isError && !messages.data ? (
          <EmptyState
            title="Couldn't load messages"
            message={getQueryErrorMessage(messages.error)}
            icon="cloud-offline-outline"
            accent={Colors.danger}
            actionLabel="Try again"
            onAction={() => void messages.refetch()}
          />
        ) : (
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            inverted
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            contentContainerStyle={[styles.list, { paddingTop: composerInset }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => scrollToLatest(false)}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello!</Text>}
          />
        )}

        <View
          style={[
            styles.composer,
            {
              bottom: keyboardOffset,
              paddingBottom: composerBottomPad,
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => scrollToLatest(true)}
            placeholder="Type a message…"
            placeholderTextColor={Colors.placeholder}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}
            onPress={() => void onSend()}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  body: { flex: 1 },
  flex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  empty: { textAlign: 'center', color: Colors.placeholder, marginTop: 40, fontSize: 14, transform: [{ scaleY: -1 }] },
  bubbleRow: { marginBottom: 10, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleMine: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: Colors.secondary },
  bubbleTextMine: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.placeholder, marginTop: 6, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  systemWrap: { alignItems: 'center', marginVertical: 8 },
  systemText: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.backgroundMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    maxWidth: '90%',
    textAlign: 'center',
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.secondary,
    backgroundColor: Colors.backgroundElement,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
