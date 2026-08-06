import { Pressable, StyleSheet, View } from "react-native";

import { DialogSurface } from "./dialog-surface";
import { ThemedText } from "./themed-text";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Generic Modal-based confirmation dialog. Used in place of `Alert.alert`, which isn't available on the static web export. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <DialogSurface visible={visible} onClose={onCancel} dismissLabel={cancelLabel}>
      <ThemedText type="smallBold">{title}</ThemedText>

      {message && (
        <ThemedText type="small" themeColor="textSecondary">
          {message}
        </ThemedText>
      )}

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.footerButton,
            pressed && styles.pressed,
          ]}
          onPress={onCancel}
        >
          <ThemedText type="smallBold" themeColor="textSecondary">
            {cancelLabel}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.confirmButton,
            { backgroundColor: theme.text },
            pressed && styles.pressed,
          ]}
          onPress={onConfirm}
        >
          <ThemedText type="smallBold" style={{ color: theme.backgroundSolid }}>
            {confirmLabel}
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
  confirmButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.6,
  },
});
