import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';
import Constants from 'expo-constants';

function keyboardShowEvent() {
  return Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
}

function keyboardHideEvent() {
  return Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
}

/** Pixels the keyboard covers from the bottom of the window. */
function keyboardOverlap(event: KeyboardEvent): number {
  const { screenY, height } = event.endCoordinates;
  const windowHeight = Dimensions.get('window').height;
  const overlap = windowHeight - screenY;
  return Math.max(0, overlap || height);
}

/**
 * Expo Go on Android ignores app.json keyboard mode — bottom bars must be lifted in JS.
 * Standalone/dev builds use native resize from app.json instead.
 */
export function usesManualKeyboardLift(): boolean {
  if (Platform.OS === 'ios') {
    return true;
  }
  return Constants.appOwnership === 'expo';
}

/** Live keyboard overlap height (all platforms). */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(keyboardShowEvent(), (event) => {
      setHeight(keyboardOverlap(event));
    });
    const hideSub = Keyboard.addListener(keyboardHideEvent(), () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

/** Bottom offset for fixed composers — skips manual lift when native resize handles it. */
export function useKeyboardBottomOffset() {
  const height = useKeyboardHeight();
  return usesManualKeyboardLift() ? height : 0;
}

/** Extra scroll padding for forms. Standalone Android uses native resize instead. */
export function useKeyboardInset() {
  const height = useKeyboardHeight();
  if (Platform.OS === 'ios') {
    return height;
  }
  if (Constants.appOwnership === 'expo') {
    return height;
  }
  return 0;
}

export function useKeyboardVisible() {
  const height = useKeyboardHeight();
  return height > 0;
}
