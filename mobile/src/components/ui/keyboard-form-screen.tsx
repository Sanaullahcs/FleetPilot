import type { ReactNode, RefObject } from 'react';
import { useEffect } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useKeyboardBottomOffset, useKeyboardInset } from '@/hooks/use-keyboard-inset';

type KeyboardFormScreenProps = {
  children: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  style?: StyleProp<ViewStyle>;
  footer?: ReactNode;
};

/**
 * Scrollable form below AppHeader.
 * iOS adds scroll padding from keyboard height. Android relies on native resize + scroll on focus.
 */
export function KeyboardFormScreen({
  children,
  scrollRef,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  style,
  footer,
}: KeyboardFormScreenProps) {
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    if (!scrollRef) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollRef]);

  return (
    <View style={[styles.flex, style]}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 12 + keyboardInset },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

type KeyboardAvoidingBodyProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Fixed footer layout below AppHeader (chat composer, etc.). */
export function KeyboardAvoidingBody({ children, style }: KeyboardAvoidingBodyProps) {
  const keyboardOffset = useKeyboardBottomOffset();

  return (
    <View style={[styles.flex, style, { paddingBottom: keyboardOffset }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
});
