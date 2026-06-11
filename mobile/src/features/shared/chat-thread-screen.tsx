import { useCallback, useEffect, useRef, useState } from 'react';

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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@/components/ui/icons';

import { AppHeader } from '@/components/shell/app-header';

import { useKeyboardBottomOffset, useKeyboardHeight } from '@/hooks/use-keyboard-inset';

import { Colors } from '@/constants/theme';

import { fetchChatConversations, fetchChatMessages, markChatConversationRead, sendChatMessage } from '@/lib/chat-api';

import type { ChatMessage } from '@/lib/chat-types';

import { showSweetAlert } from '@/store/sweet-alert';
import { useChatBannerStore } from '@/store/chat-banner';



const COMPOSER_ESTIMATE = 68;



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

  const listRef = useRef<FlatList>(null);

  const [draft, setDraft] = useState('');

  const [sending, setSending] = useState(false);



  const conversations = useQuery({

    queryKey: ['chat-conversations'],

    queryFn: fetchChatConversations,

  });



  const conversation = conversations.data?.items.find((c) => c.id === conversationId);



  const messages = useQuery({

    queryKey: ['chat-messages', conversationId],

    queryFn: () => fetchChatMessages(conversationId!),

    enabled: !!conversationId,

    refetchInterval: 5_000,

  });



  const sendMutation = useMutation({

    mutationFn: (body: string) => sendChatMessage(conversationId!, body),

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });

      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });

    },

  });



  const scrollToLatest = useCallback(() => {

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  }, []);



  useEffect(() => {

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    const sub = Keyboard.addListener(showEvent, scrollToLatest);

    return () => sub.remove();

  }, [scrollToLatest]);



  useEffect(() => {

    if (!conversationId) return;

    let cancelled = false;

    (async () => {

      try {

        await markChatConversationRead(conversationId);

        if (!cancelled) {

          queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
          queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });

        }

      } catch {

        /* badge clears on next messages fetch */

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [conversationId, queryClient]);



  const onSend = useCallback(async () => {

    const body = draft.trim();

    if (!body || !conversationId) return;

    setSending(true);

    setDraft('');

    try {

      await sendMutation.mutateAsync(body);

      scrollToLatest();

    } catch {

      setDraft(body);

      showSweetAlert({ type: 'error', title: 'Message failed', message: 'Could not send. Try again.' });

    } finally {

      setSending(false);

    }

  }, [draft, conversationId, sendMutation, scrollToLatest]);



  return (

    <View style={styles.root}>

      <AppHeader

        title={conversation?.title ?? 'Conversation'}

        subtitle={conversation?.subtitle ?? 'Loading…'}

        onBackPress={() => router.back()}

      />

      <View style={styles.body}>

        {messages.isLoading ? (

          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />

        ) : (

          <FlatList

            ref={listRef}

            style={styles.flex}

            data={messages.data ?? []}

            keyExtractor={(item) => item.id}

            contentContainerStyle={[

              styles.list,

              { paddingBottom: COMPOSER_ESTIMATE + composerBottomPad + keyboardOffset },

            ]}

            keyboardShouldPersistTaps="handled"

            keyboardDismissMode="interactive"

            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}

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

            onFocus={scrollToLatest}

            placeholder="Type a message…"

            placeholderTextColor={Colors.placeholder}

            style={styles.input}

            multiline

            maxLength={2000}

          />

          <Pressable

            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}

            onPress={onSend}

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

  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  empty: { textAlign: 'center', color: Colors.placeholder, marginTop: 40, fontSize: 14 },

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


