import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth';
import { AuthScreen } from '@/features/auth/auth-screen';
import { isMobileRole } from '@/constants/app';
import { SweetAlertHost } from '@/components/ui/sweet-alert-host';
import { AppSplashScreen } from '@/components/splash/app-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate() {
  const { token, user, loading, hydrate, clear } = useAuthStore();
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(async () => {
        setSplashVisible(false);
        await SplashScreen.hideAsync();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && token && user && !isMobileRole(user.role)) {
      clear();
    }
  }, [loading, token, user, clear]);

  if (loading || splashVisible) {
    return <AppSplashScreen />;
  }

  const allowed = token && user && isMobileRole(user.role);
  return allowed ? (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="run/[assignmentId]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="support" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="legal/[document]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="delete-account" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="child/[studentId]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="chat/[conversationId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  ) : (
    <AuthScreen />
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate />
        <SweetAlertHost />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
