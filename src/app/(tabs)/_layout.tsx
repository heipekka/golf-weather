import { Link, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundElement,
        },
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
                style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}>
                <SymbolView
                  name={{ ios: "gearshape", android: "settings", web: "settings" }}
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
                style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}>
                <SymbolView
                  name={{ ios: "gearshape", android: "settings", web: "settings" }}
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
            <SymbolView
              name={{
                ios: focused ? "figure.golf.circle.fill" : "figure.golf.circle",
                android: "sports_golf",
                web: "sports_golf",
              }}
              size={22}
              tintColor={color}
            />
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
});
