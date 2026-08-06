import { Link, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Platform, Pressable, StyleSheet, type ViewStyle } from "react-native";

import { TeeTimeTabIcon } from "@/components/tee-time-tab-icon";
import { GlassSurface, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useResolvedPalette } from "@/hooks/use-theme-mode";
import { useI18n } from "@/i18n";

export default function TabsLayout() {
  const theme = useTheme();
  const palette = useResolvedPalette();
  const isGlass = palette === "glass";
  const { t } = useI18n();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: isGlass
          ? {
              backgroundColor: theme.backgroundElement,
              borderTopColor: GlassSurface.borderColor,
              ...(Platform.OS === "web"
                ? ({ backdropFilter: GlassSurface.webBackdropFilter } as ViewStyle)
                : null),
            }
          : {
              backgroundColor: theme.background,
              borderTopColor: theme.backgroundElement,
            },
        sceneStyle: isGlass ? styles.transparentScene : undefined,
      }}
    >
      <Tabs.Screen
        name="courses"
        options={{
          title: t("tabs.courses"),
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: focused ? "flag.fill" : "flag",
                android: "flag",
                web: "flag",
              }}
              size={22}
              tintColor={color}
            />
          ),
          headerShown: true,
          headerTitle: t("app.title"),
          headerTitleAlign: "center",
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("courses.openSettings")}
                hitSlop={Spacing.two}
                style={({ pressed }) => [
                  styles.settingsButton,
                  pressed && styles.settingsButtonPressed,
                ]}
              >
                <SymbolView
                  name={{
                    ios: "gearshape",
                    android: "settings",
                    web: "settings",
                  }}
                  size={24}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </Link>
          ),
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t("tabs.favorites"),
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: focused ? "star.fill" : "star",
                android: "star",
                web: "star",
              }}
              size={22}
              tintColor={color}
            />
          ),
          headerShown: true,
          headerTitle: t("favorites.title"),
          headerTitleAlign: "center",
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("courses.openSettings")}
                hitSlop={Spacing.two}
                style={({ pressed }) => [
                  styles.settingsButton,
                  pressed && styles.settingsButtonPressed,
                ]}
              >
                <SymbolView
                  name={{
                    ios: "gearshape",
                    android: "settings",
                    web: "settings",
                  }}
                  size={24}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </Link>
          ),
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: t("tabs.bookmarks"),
          tabBarIcon: ({ color, focused }) => (
            <TeeTimeTabIcon color={color} focused={focused} />
          ),
          // The bookmarks route is a nested stack (list + detail) that owns
          // its own per-screen headers, so the tab-level header stays off.
          headerShown: false,
        }}
      />
      <Tabs.Screen name="course" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    padding: Spacing.one,
  },
  settingsButtonPressed: {
    opacity: 0.6,
  },
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
  transparentScene: {
    backgroundColor: "transparent",
  },
});
