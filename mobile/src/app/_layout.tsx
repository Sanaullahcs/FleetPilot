import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth';
import { LoginScreen } from '@/features/auth/login-screen';
import { Colors } from '@/constants/theme';

function AuthGate() {
  const { token, loading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundElement }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return token ? <Slot /> : <LoginScreen />;
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
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
