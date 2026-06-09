import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';

export function AuthMeshBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, styles.blobPrimary]} />
      <View style={[styles.blob, styles.blobAccent]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.45,
  },
  blobPrimary: {
    width: 260,
    height: 260,
    top: -60,
    right: -40,
    backgroundColor: Colors.primaryLight,
  },
  blobAccent: {
    width: 200,
    height: 200,
    bottom: 80,
    left: -50,
    backgroundColor: Colors.backgroundElement,
  },
});
