import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import { formatDayLabel, formatDistance, formatHour } from "@/lib/format";
import type { Playability } from "@/lib/golf";
import { ALTERNATIVE_RADIUS_KM, type TeeTimeAlternative } from "@/lib/tee-time-alternatives";
import { DialogSurface } from "./dialog-surface";
import { PlayabilityBadge } from "./playability-badge";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

export type TeeTimeAlternativesDialogProps = {
  visible: boolean;
  /** The hour the tee time is booked for; alternatives are scored for this same hour. */
  teeTime: Date;
  courseName: string;
  playability: Playability | null;
  alternatives: TeeTimeAlternative[];
  onSelect: (courseId: string) => void;
  onClose: () => void;
};

/** Lists nearby courses with better conditions at an unchanged tee time, and switches the tee time to the one tapped. */
export function TeeTimeAlternativesDialog({
  visible,
  teeTime,
  courseName,
  playability,
  alternatives,
  onSelect,
  onClose,
}: TeeTimeAlternativesDialogProps) {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const teeTimeIso = teeTime.toISOString();

  return (
    <DialogSurface visible={visible} onClose={onClose} dismissLabel={t("bookmarks.cancel")}>
      <ThemedText type="smallBold">{t("bookmarks.alternativesTitle")}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t("bookmarks.alternativesMessage", { radius: ALTERNATIVE_RADIUS_KM })}
      </ThemedText>

      <View style={styles.current}>
        <ThemedText type="small" themeColor="textSecondary">
          {`${t("bookmarks.alternativesCurrent")} · ${formatDayLabel(teeTimeIso, locale)} ${formatHour(teeTimeIso, locale)}`}
        </ThemedText>
        <View style={styles.row}>
          <ThemedText type="small" style={styles.name} numberOfLines={1}>
            {courseName}
          </ThemedText>
          {playability && <PlayabilityBadge playability={playability} />}
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {alternatives.map(({ course, playability: candidate }) => (
          <Pressable
            key={course.id}
            accessibilityRole="button"
            accessibilityLabel={t("bookmarks.alternativesSwitch", { course: course.name })}
            onPress={() => onSelect(course.id)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ThemedView type="backgroundElement" style={styles.option}>
              <View style={styles.optionText}>
                <ThemedText type="small" numberOfLines={1}>
                  {course.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {`${course.city} · ${formatDistance(course.distanceKm)}`}
                </ThemedText>
              </View>
              <PlayabilityBadge playability={candidate} />
              <SymbolView
                name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                size={14}
                tintColor={theme.textSecondary}
              />
            </ThemedView>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          onPress={onClose}
        >
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t("bookmarks.cancel")}
          </ThemedText>
        </Pressable>
      </View>
    </DialogSurface>
  );
}

const styles = StyleSheet.create({
  current: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
  // Capped so a full set of options can't push the footer off a short screen.
  list: {
    maxHeight: 260,
  },
  listContent: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  optionText: {
    flex: 1,
    gap: Spacing.half,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: Spacing.one,
  },
  footerButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
