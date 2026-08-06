import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useGlassBackdropStyle, useIsGlassPalette } from "@/hooks/use-glass-surface";

type DialogSurfaceProps = {
  visible: boolean;
  onClose: () => void;
  /** Accessibility label for the tap-outside-to-dismiss backdrop. */
  dismissLabel: string;
  maxWidth?: number;
  children: ReactNode;
};

/**
 * Shared Modal + backdrop + panel shell for the app's dialogs. The panel
 * uses the same frosted `backgroundElement` treatment as course cards in the
 * glass palette (translucent white, hairline border, web blur — see
 * `ThemedView`), since a plain `background` panel is fully transparent
 * there. Outside glass, the panel stays the opaque `background` surface
 * with the existing hairline border.
 */
export function DialogSurface({
  visible,
  onClose,
  dismissLabel,
  maxWidth = 360,
  children,
}: DialogSurfaceProps) {
  const theme = useTheme();
  const isGlass = useIsGlassPalette();
  const glassBackdrop = useGlassBackdropStyle();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, glassBackdrop]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
        />
        <ThemedView
          type={isGlass ? "backgroundElement" : "background"}
          style={[
            styles.dialog,
            { maxWidth },
            !isGlass && {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.textSecondary,
            },
          ]}
        >
          {children}
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
    padding: Spacing.four,
    gap: Spacing.two,
    width: "100%",
  },
});
