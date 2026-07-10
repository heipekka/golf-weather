import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { LocationPicker } from './location-picker';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import type { Coordinates } from '@/lib/geo';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('locationButton.title')}
        />
        <ThemedView
          type="background"
          style={[styles.dialog, { borderColor: theme.textSecondary }]}
        >
          <ThemedText type="smallBold">{t('locationButton.title')}</ThemedText>

          <LocationPicker value={draft} onChange={setDraft} />

          <View style={styles.footer}>
            {showUseDeviceLocation ? (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
                onPress={handleUseDeviceLocation}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {t('locationButton.myLocation')}
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
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {t('locationButton.done')}
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
    maxWidth: 400,
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
  doneButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.6,
  },
});
