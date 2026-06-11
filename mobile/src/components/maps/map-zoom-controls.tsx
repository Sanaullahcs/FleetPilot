import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';

export function MapZoomControls({
  bottom = 16,
  onZoomIn,
  onZoomOut,
}: {
  bottom?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <Pressable style={styles.btn} onPress={onZoomIn} accessibilityLabel="Zoom in" hitSlop={4}>
        <Ionicons name="add" size={22} color={Colors.secondary} />
      </Pressable>
      <Pressable style={styles.btn} onPress={onZoomOut} accessibilityLabel="Zoom out" hitSlop={4}>
        <Ionicons name="remove" size={22} color={Colors.secondary} />
      </Pressable>
    </View>
  );
}

const glass = {
  backgroundColor: 'rgba(255,255,255,0.97)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.7)',
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 14,
    gap: 10,
    alignItems: 'center',
  },
  btn: {
    ...glass,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
