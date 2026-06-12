import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';
import { useChatBannerStore } from '@/store/chat-banner';

export function ChatMessageBannerHost() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const banner = useChatBannerStore((s) => s.banner);
  const hideBanner = useChatBannerStore((s) => s.hideBanner);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => hideBanner(), 7000);
    return () => clearTimeout(timer);
  }, [banner, hideBanner]);

  if (!banner) {
    return null;
  }

  const openThread = () => {
    hideBanner();
    router.push(`/chat/${banner.conversationId}`);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.wrap, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.card} onPress={openThread}>
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses" size={18} color={Colors.white} />
        </View>
        <View style={styles.body}>
          <Text style={styles.badge}>New message</Text>
          <Text style={styles.title} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={styles.preview} numberOfLines={2}>
            {banner.body}
          </Text>
        </View>
        <Pressable
          style={styles.closeBtn}
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation();
            hideBanner();
          }}
        >
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    alignSelf: 'flex-start',
    marginBottom: 2,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
  preview: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  closeBtn: {
    padding: 4,
  },
});
