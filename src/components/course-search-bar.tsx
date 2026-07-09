import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";

export type CourseSearchBarProps = {
  query: string;
  onChangeQuery: (value: string) => void;
};

/** Persistent search input filtering courses by name/city, shown in the courses list header. */
export function CourseSearchBar({
  query,
  onChangeQuery,
}: CourseSearchBarProps) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View
      style={[
        styles.inputSurface,
        { backgroundColor: theme.backgroundElement },
      ]}
    >
      <SymbolView
        name={{ ios: "magnifyingglass", android: "search", web: "search" }}
        size={18}
        tintColor={theme.textSecondary}
      />
      <TextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder={t("courseSearch.placeholder")}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        style={[styles.input, { color: theme.text }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("courseSearch.clear")}
        accessibilityElementsHidden={query.length === 0}
        importantForAccessibility={
          query.length === 0 ? "no-hide-descendants" : "yes"
        }
        hitSlop={Spacing.two}
        disabled={query.length === 0}
        style={({ pressed }) => [
          styles.clearButton,
          query.length === 0 && styles.clearButtonHidden,
          pressed && styles.pressed,
        ]}
        onPress={() => onChangeQuery("")}
      >
        <SymbolView
          name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
          size={20}
          tintColor={theme.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputSurface: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 36,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    outlineStyle: "none",
  } as object,
  clearButton: {
    padding: Spacing.one,
  },
  clearButtonHidden: {
    opacity: 0,
  },
  pressed: {
    opacity: 0.6,
  },
});
