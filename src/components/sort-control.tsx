import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

const MIN_PERCENT = 0;
const MAX_PERCENT = 100;
const STEP_PERCENT = 5;

type SortControlProps = {
  /** Weather weight in `[0, 1]`: `0` sorts purely by distance, `1` purely by current playability. */
  value: number;
  onChange: (weight: number, options?: { persist?: boolean }) => void;
};

/** Slider choosing how much weight is put on current weather vs. distance when ranking courses. */
export function SortControl({ value, onChange }: SortControlProps) {
  const { t } = useI18n();
  const theme = useTheme();

  const weatherPercent = Math.round(value * 100);
  const locationPercent = 100 - weatherPercent;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="small" themeColor={locationPercent >= weatherPercent ? 'text' : 'textSecondary'}>
          {t('sort.location')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {locationPercent}% / {weatherPercent}%
        </ThemedText>
        <ThemedText type="small" themeColor={weatherPercent > locationPercent ? 'text' : 'textSecondary'}>
          {t('sort.weather')}
        </ThemedText>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={MIN_PERCENT}
        maximumValue={MAX_PERCENT}
        step={STEP_PERCENT}
        value={weatherPercent}
        onValueChange={(percent) => onChange(percent / 100, { persist: false })}
        onSlidingComplete={(percent) => onChange(percent / 100, { persist: true })}
        minimumTrackTintColor={theme.text}
        maximumTrackTintColor={theme.textSecondary}
        thumbTintColor={theme.text}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 32,
    marginTop: -Spacing.half,
  },
});
