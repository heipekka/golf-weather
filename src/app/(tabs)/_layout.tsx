import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
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
        }}
      />
    </Tabs>
  );
}
