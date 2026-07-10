import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useI18n, type TranslationKey } from '@/i18n';
import { type SortMode } from '@/lib/course-sort';

const SORT_MODE_LABEL_KEYS: Record<SortMode, TranslationKey> = {
  location: 'sort.location',
  weather: 'sort.weather',
  combined: 'sort.combined',
};

const SORT_MODES: SortMode[] = ['location', 'combined', 'weather'];

type SortControlProps = {
  value: SortMode;
  onChange: (mode: SortMode) => void;
};

export function SortControl({ value, onChange }: SortControlProps) {
  const { t } = useI18n();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {SORT_MODES.map((mode) => {
        const isSelected = mode === value;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <ThemedView
              type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.buttonInner}>
              <ThemedText type="small" themeColor={isSelected ? 'text' : 'textSecondary'}>
                {t(SORT_MODE_LABEL_KEYS[mode])}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  button: {
    flex: 1,
  },
  buttonInner: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
