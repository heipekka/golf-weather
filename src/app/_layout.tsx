import { Image } from "expo-image";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { enableScreens } from "react-native-screens";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { BookmarksProvider } from "@/hooks/use-bookmarks";
import { CourseListLabelsProvider } from "@/hooks/use-course-list-labels";
import { SortModeProvider } from "@/hooks/use-course-sort";
import { DarkScoringProvider } from "@/hooks/use-dark-scoring";
import { DistanceFilterProvider } from "@/hooks/use-distance-filter";
import { FavoritesProvider } from "@/hooks/use-favorites";
import { LocationProvider } from "@/hooks/use-location";
import { StartTimeProvider } from "@/hooks/use-start-time";
import {
    ThemeModeProvider,
    useResolvedColorScheme,
    useResolvedPalette,
    useThemeMode,
} from "@/hooks/use-theme-mode";
import { WindLabelsProvider } from "@/hooks/use-wind-labels";
import { LanguageProvider } from "@/i18n";
import { recordSession } from "@/lib/usage-log";

SplashScreen.preventAutoHideAsync();

// The bottom tabs keep every visited tab mounted as an absolutely positioned
// sibling and rely on react-native-screens to hide the unfocused ones. It only
// enables itself on native, so on web the glass palette's transparent scene
// background is all that separated the tabs and the previous one showed through.
if (Platform.OS === "web") {
  enableScreens();
}

// Reuses the built-in dark navigation theme but makes the screen/card
// backgrounds transparent so the AppBackdrop photo shows through, and lifts
// the border/primary colors to match the glass palette in constants/theme.ts.
const GlassNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3ddc84",
    background: "transparent",
    card: "transparent",
    border: "rgba(255, 255, 255, 0.35)",
    text: "#ffffff",
  },
};

const BACKGROUND_SOURCES = {
  photo: require("@/assets/images/backgrounds/course-photo.jpg"),
  illustration: require("@/assets/images/backgrounds/course-illustration.jpg"),
};

// Full-bleed photo behind the whole app plus a dark scrim for text legibility,
// only rendered for the glass palette. Sits behind the Stack, which is why it
// must be a sibling rendered before it rather than a wrapper.
function AppBackdrop() {
  const palette = useResolvedPalette();
  const { glassBackground } = useThemeMode();

  if (palette !== "glass") return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        style={StyleSheet.absoluteFill}
        source={BACKGROUND_SOURCES[glassBackground]}
        contentFit="cover"
      />
      <View style={styles.scrim} />
    </View>
  );
}

// Reads the resolved color scheme (OS or explicit override) and feeds it to
// expo-router's own ThemeProvider. Must render inside ThemeModeProvider.
function ThemedApp() {
  const resolvedScheme = useResolvedColorScheme();
  const palette = useResolvedPalette();
  const isGlass = palette === "glass";
  const navTheme = isGlass
    ? GlassNavTheme
    : resolvedScheme === "dark"
      ? DarkTheme
      : DefaultTheme;

  return (
    <ThemeProvider value={navTheme}>
      <AppBackdrop />
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: isGlass ? styles.transparentContent : undefined,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ headerShown: true }} />
        <Stack.Screen name="usage" options={{ headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  transparentContent: {
    backgroundColor: "transparent",
  },
});

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
                <WindLabelsProvider>
                  <CourseListLabelsProvider>
                    <StartTimeProvider>
                      <DistanceFilterProvider>
                        <ThemeModeProvider>
                          <ThemedApp />
                        </ThemeModeProvider>
                      </DistanceFilterProvider>
                    </StartTimeProvider>
                  </CourseListLabelsProvider>
                </WindLabelsProvider>
              </DarkScoringProvider>
            </SortModeProvider>
          </BookmarksProvider>
        </FavoritesProvider>
      </LocationProvider>
    </LanguageProvider>
  );
}
