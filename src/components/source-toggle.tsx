import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n, type TranslationKey } from '@/i18n';

export type ViewMode = 'combined' | 'sideBySide';

const OPTIONS: { value: ViewMode; labelKey: TranslationKey }[] = [
  { value: 'combined', labelKey: 'sourceToggle.combined' },
  { value: 'sideBySide', labelKey: 'sourceToggle.bySource' },
];

export function SourceToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
              {t(option.labelKey)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
