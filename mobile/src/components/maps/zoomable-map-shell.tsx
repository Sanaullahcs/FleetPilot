import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MapZoomControls } from '@/components/maps/map-zoom-controls';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.6;

export function ZoomableMapShell({
  children,
  controlsBottom = 16,
}: {
  children: React.ReactNode;
  controlsBottom?: number;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetPan = useCallback(() => {
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [savedTranslateX, savedTranslateY, translateX, translateY]);

  const applyScale = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      scale.value = withTiming(clamped, { duration: 180 });
      savedScale.value = clamped;
      if (clamped <= MIN_SCALE) resetPan();
    },
    [resetPan, savedScale, scale],
  );

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        runOnJS(resetPan)();
      }
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (savedScale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(applyScale)(savedScale.value > 1.4 ? MIN_SCALE : 2.2);
    });

  const gesture = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.shell}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.content, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>

      <MapZoomControls
        bottom={controlsBottom}
        onZoomIn={() => applyScale(savedScale.value + ZOOM_STEP)}
        onZoomOut={() => applyScale(savedScale.value - ZOOM_STEP)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, overflow: 'hidden' },
  content: { flex: 1, width: '100%', height: '100%' },
});
