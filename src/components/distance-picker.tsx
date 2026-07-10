import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

const MIN_KM = 30;
const MAX_KM = 700;
const STEP_KM = 10;

type DistancePickerProps = {
  visible: boolean;
  value: number;
  onClose: () => void;
  onSelect: (km: number) => void;
};

/** Modal slider dialog for choosing the max course distance (30–700 km, 10 km steps). Applies the selection on Done. */
export function DistancePicker({ visible, value, onClose, onSelect }: DistancePickerProps) {
  const { t } = useI18n();
  const theme = useTheme();

  // Re-seed the slider from the committed value each time the dialog opens,
  // so a dismissed-without-saving drag doesn't persist in the UI.
  const [wasVisible, setWasVisible] = useState(visible);
  const [draft, setDraft] = useState(value);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(value);
  }

  function handleDone() {
    onSelect(draft);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('distance.title')}
        />
        <ThemedView
          type="background"
          style={[styles.dialog, { borderColor: theme.textSecondary }]}
        >
          <ThemedText type="smallBold">{t('distance.title')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('distance.description')}
          </ThemedText>

          <ThemedText type="smallBold" style={styles.valueLabel}>
            {t('distance.label').replace('{km}', String(draft))}
          </ThemedText>

          <Slider
            style={styles.slider}
            minimumValue={MIN_KM}
            maximumValue={MAX_KM}
            step={STEP_KM}
            value={draft}
            onValueChange={setDraft}
            minimumTrackTintColor={theme.text}
            maximumTrackTintColor={theme.textSecondary}
            thumbTintColor={theme.text}
          />

          <View style={styles.rangeRow}>
            <ThemedText type="small" themeColor="textSecondary">{MIN_KM} km</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{MAX_KM} km</ThemedText>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
              onPress={() => { onSelect(200); onClose(); }}
            >
              <ThemedText type="smallBold" themeColor="textSecondary">
                200 km
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
                {t('distance.done')}
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
  valueLabel: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
