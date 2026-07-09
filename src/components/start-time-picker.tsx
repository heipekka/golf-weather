import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import { formatDayLabel } from "@/lib/format";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

/** How many days forward (including today) the day picker offers — one week. */
const DAYS_AHEAD = 8;

type StartTimePickerProps = {
  visible: boolean;
  /** The currently active start time, or `null` if it's "now". Used to seed the picker's initial selection. */
  value: Date | null;
  onClose: () => void;
  onSelect: (time: Date) => void;
  onReset: () => void;
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dayOffsetOf(date: Date, today: Date): number {
  return Math.max(
    0,
    Math.min(
      DAYS_AHEAD - 1,
      Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000),
    ),
  );
}

/** Custom in-app date+time picker (day chips + hour chips), shown in a modal dialog. Works identically on web and native without a native picker dependency. */
export function StartTimePicker({
  visible,
  value,
  onClose,
  onSelect,
  onReset,
}: StartTimePickerProps) {
  const { t, locale } = useI18n();
  const theme = useTheme();

  const today = startOfDay(new Date());
  const days = Array.from({ length: DAYS_AHEAD }, (_, index) =>
    addDays(today, index),
  );

  // Re-seeds the selection from the current value each time the dialog opens
  // (rather than only on mount), so reopening it doesn't show a stale
  // in-progress pick from last time. Adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect, avoids an extra
  // effect-driven render pass.
  const [wasVisible, setWasVisible] = useState(visible);
  const [dayOffset, setDayOffset] = useState(() =>
    dayOffsetOf(value ?? new Date(), today),
  );
  const [hour, setHour] = useState(() => (value ?? new Date()).getHours());
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      const base = value ?? new Date();
      setDayOffset(dayOffsetOf(base, today));
      setHour(base.getHours());
    }
  }

  const now = new Date();
  const isToday = dayOffset === 0;
  const minHour = isToday ? now.getHours() : 0;
  const hours = Array.from(
    { length: 24 - minHour },
    (_, index) => minHour + index,
  );

  function selectDay(offset: number) {
    setDayOffset(offset);
    const newMinHour = offset === 0 ? now.getHours() : 0;
    if (hour < newMinHour) setHour(newMinHour);
  }

  function handleDone() {
    const selected = new Date(days[dayOffset]);
    selected.setHours(hour, 0, 0, 0);
    onSelect(selected);
    onClose();
  }

  function handleNow() {
    onReset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("startTime.title")}
        />
        <ThemedView
          type="background"
          style={[styles.dialog, { borderColor: theme.textSecondary }]}
        >
          <ThemedText type="smallBold">{t("startTime.title")}</ThemedText>

          <ThemedText type="small" themeColor="textSecondary">
            {t("startTime.selectDay")}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {days.map((day, offset) => {
              const isSelected = offset === dayOffset;
              return (
                <Pressable
                  key={day.toISOString()}
                  onPress={() => selectDay(offset)}
                >
                  <ThemedView
                    type={
                      isSelected ? "backgroundSelected" : "backgroundElement"
                    }
                    style={styles.chip}
                  >
                    <ThemedText
                      type="small"
                      themeColor={isSelected ? "text" : "textSecondary"}
                    >
                      {offset === 0
                        ? t("startTime.today")
                        : formatDayLabel(day.toISOString(), locale)}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedText type="small" themeColor="textSecondary">
            {t("startTime.selectHour")}
          </ThemedText>
          <View style={styles.hourGrid}>
            {hours.map((h) => {
              const isSelected = h === hour;
              return (
                <Pressable
                  key={h}
                  onPress={() => setHour(h)}
                  style={styles.hourChipWrapper}
                >
                  <ThemedView
                    type={
                      isSelected ? "backgroundSelected" : "backgroundElement"
                    }
                    style={styles.hourChip}
                  >
                    <ThemedText
                      type="small"
                      themeColor={isSelected ? "text" : "textSecondary"}
                    >
                      {`${h.toString().padStart(2, "0")}:00`}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.footerButton,
                pressed && styles.pressed,
              ]}
              onPress={handleNow}
            >
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t("startTime.now")}
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.doneButton,
                { backgroundColor: theme.text },
                pressed && styles.pressed,
              ]}
              onPress={handleDone}
            >
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {t("startTime.done")}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  dialog: {
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.two,
    width: "100%",
    maxWidth: 360,
  },
  chipRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  hourChipWrapper: {
    width: "22%",
  },
  hourChip: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.two,
  },
  footerButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  doneButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.6,
  },
});
