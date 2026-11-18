import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/utils/webAlert';
import { ScreenTourBar } from '@/components/preview/ScreenTourBar';
import { LoadingState } from '@/components/ui';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { useBrandFonts } from '@/hooks/useBrandFonts';
import { unlockUiPreview } from '@/features/preview/uiPreviewSession';
import { colors } from '@/theme';

if (FRONTEND_ONLY) {
  unlockUiPreview();
}

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden in some environments.
});

export default function RootLayout() {
  const fontsLoaded = useBrandFonts();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.canvas }}>
        <LoadingState message="Preparing YuktiOne…" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background.canvas },
                animation: 'fade',
              }}
            />
            <ScreenTourBar />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
