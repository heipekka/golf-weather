import { useRouter, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type BackButtonProps = {
  accessibilityLabel: string;
  /** Route to fall back to when there's no screen to go back to (e.g. direct deep link). */
  fallbackHref: Href;
};

export function BackButton({ accessibilityLabel, fallbackHref }: BackButtonProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={Spacing.two}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.navigate(fallbackHref);
      }}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
    >
      <SymbolView
        name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
        size={22}
        tintColor={theme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
});
