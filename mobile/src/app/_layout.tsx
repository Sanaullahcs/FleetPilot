import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { Stack, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuthStore } from '@/store/auth';
import { SweetAlertHost } from '@/components/ui/sweet-alert-host';
import { AppSplashScreen } from '@/components/splash/app-splash-screen';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FleetPilot crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error.message}</Text>
          <Pressable style={styles.errorBtn} onPress={() => this.setState({ error: null })}>
            <Text style={styles.errorBtnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppRoot() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const loading = useAuthStore((s) => s.loading);
  const navigationState = useRootNavigationState();
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts(Ionicons.font);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await hydrate();
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (e) {
        console.error('Startup failed:', e);
      } finally {
        if (!cancelled) {
          setReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const showOverlay = !ready || loading || !fontsLoaded || !navigationState?.key;

  return (
    <View style={styles.appRoot}>
      <Stack screenOptions={{ headerShown: false }} />
      {showOverlay ? (
        <View style={styles.splashOverlay} pointerEvents="auto">
          <AppSplashScreen />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AppRoot />
          <SweetAlertHost />
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.backgroundAuth,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.secondary, marginBottom: 8 },
  errorText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  errorBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorBtnText: { color: Colors.white, fontWeight: '600' },
});
