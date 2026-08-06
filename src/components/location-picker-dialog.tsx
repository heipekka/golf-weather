import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { DialogSurface } from "./dialog-surface";
import { LocationPicker } from "./location-picker";
import { ThemedText } from "./themed-text";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import type { Coordinates } from "@/lib/geo";

type LocationPickerDialogProps = {
  visible: boolean;
  /** Seed value shown on the map when the dialog opens. */
  value: Coordinates | null;
  onClose: () => void;
  /** Called with the tapped coordinate when the user presses Done. */
  onSelect: (coords: Coordinates) => void;
  /** Whether device GPS is available, showing a "My location" reset button. */
  showUseDeviceLocation?: boolean;
  /** Called when "My location" is pressed, to revert back to live device GPS. */
  onUseDeviceLocation?: () => void;
};

/** Modal dialog wrapping LocationPicker (same map as settings). Saves the tapped spot on Done. */
export function LocationPickerDialog({
  visible,
  value,
  onClose,
  onSelect,
  showUseDeviceLocation,
  onUseDeviceLocation,
}: LocationPickerDialogProps) {
  const { t } = useI18n();
  const theme = useTheme();

  // Re-seed draft from value each time dialog opens so a dismissed-without-saving
  // tap doesn't persist.
  const [wasVisible, setWasVisible] = useState(visible);
  const [draft, setDraft] = useState<Coordinates | null>(value);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(value);
  }

  function handleDone() {
    if (draft) {
      onSelect(draft);
    }
    onClose();
  }

  function handleUseDeviceLocation() {
    onUseDeviceLocation?.();
    onClose();
  }

  return (
    <DialogSurface
      visible={visible}
      onClose={onClose}
      dismissLabel={t("locationButton.title")}
      maxWidth={400}
    >
      <ThemedText type="smallBold">{t("locationButton.title")}</ThemedText>

      <LocationPicker value={draft} onChange={setDraft} height={420} />

      <View style={styles.footer}>
        {showUseDeviceLocation ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.footerButton,
              pressed && styles.pressed,
            ]}
            onPress={handleUseDeviceLocation}
          >
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t("locationButton.myLocation")}
            </ThemedText>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          accessibilityRole="button"
          disabled={!draft}
          style={({ pressed }) => [
            styles.doneButton,
            { backgroundColor: draft ? theme.text : theme.textSecondary },
            pressed && styles.pressed,
          ]}
          onPress={handleDone}
        >
          <ThemedText type="smallBold" style={{ color: theme.backgroundSolid }}>
            {t("locationButton.done")}
          </ThemedText>
        </Pressable>
      </View>
    </DialogSurface>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.one,
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
