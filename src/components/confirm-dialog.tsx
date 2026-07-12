import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <ThemedView
          type="background"
          style={[styles.dialog, { borderColor: theme.textSecondary }]}
        >
          <ThemedText type="smallBold">{title}</ThemedText>

          {message && (
            <ThemedText type="small" themeColor="textSecondary">
              {message}
            </ThemedText>
          )}

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
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
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {confirmLabel}
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  dialog: {
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.two,
    width: '100%',
    maxWidth: 360,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
