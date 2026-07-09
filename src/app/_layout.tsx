import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SortModeProvider } from '@/hooks/use-course-sort';
import { FavoritesProvider } from '@/hooks/use-favorites';
import { LocationProvider } from '@/hooks/use-location';
import { LanguageProvider } from '@/i18n';
import { recordSession } from '@/lib/usage-log';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    recordSession();
  }, []);

  return (
    <LanguageProvider>
      <LocationProvider>
        <FavoritesProvider>
          <SortModeProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="settings" options={{ headerShown: true }} />
                <Stack.Screen name="usage" options={{ headerShown: true }} />
              </Stack>
            </ThemeProvider>
          </SortModeProvider>
        </FavoritesProvider>
      </LocationProvider>
    </LanguageProvider>
  );
}
