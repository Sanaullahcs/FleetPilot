import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FleetPilotLogoMark } from '@/components/brand/logo-mark';
import { Colors } from '@/constants/theme';

/** Branded loading splash — shown while auth/session hydrates */
export function AppSplashScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.logoWrap}>
        <FleetPilotLogoMark size={64} />
      </View>
      <Text style={styles.title}>FleetPilot</Text>
      <Text style={styles.subtitle}>School bus app for drivers & parents</Text>
      <ActivityIndicator size="small" color={Colors.white} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
  },
  logoWrap: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  spinner: { marginTop: 28 },
});
