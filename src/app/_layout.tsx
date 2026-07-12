import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BookmarksProvider } from '@/hooks/use-bookmarks';
import { SortModeProvider } from '@/hooks/use-course-sort';
import { DarkScoringProvider } from '@/hooks/use-dark-scoring';
import { DistanceFilterProvider } from '@/hooks/use-distance-filter';
import { FavoritesProvider } from '@/hooks/use-favorites';
import { LocationProvider } from '@/hooks/use-location';
import { StartTimeProvider } from '@/hooks/use-start-time';
import { ThemeModeProvider, useResolvedColorScheme } from '@/hooks/use-theme-mode';
import { LanguageProvider } from '@/i18n';
import { recordSession } from '@/lib/usage-log';

SplashScreen.preventAutoHideAsync();

// Reads the resolved color scheme (OS or explicit override) and feeds it to
// expo-router's own ThemeProvider. Must render inside ThemeModeProvider.
function ThemedApp() {
  const resolvedScheme = useResolvedColorScheme();

  return (
    <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ headerShown: true }} />
        <Stack.Screen name="usage" options={{ headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    recordSession();
  }, []);

  return (
    <LanguageProvider>
      <LocationProvider>
        <FavoritesProvider>
          <BookmarksProvider>
            <SortModeProvider>
              <DarkScoringProvider>
                <StartTimeProvider>
                  <DistanceFilterProvider>
                    <ThemeModeProvider>
                      <ThemedApp />
                    </ThemeModeProvider>
                  </DistanceFilterProvider>
                </StartTimeProvider>
              </DarkScoringProvider>
            </SortModeProvider>
          </BookmarksProvider>
        </FavoritesProvider>
      </LocationProvider>
    </LanguageProvider>
  );
}
