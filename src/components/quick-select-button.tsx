import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { CourseListPicker } from './course-list-picker';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

/** Icon-only trigger for the preset course list picker. Styled like the other
 * header pills, minus the label. */
export function QuickSelectButton() {
  const { t } = useI18n();
  const theme = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('courseLists.open')}
        hitSlop={Spacing.two}
        onPress={() => setPickerVisible(true)}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <ThemedView type="backgroundElement" style={styles.inner}>
          <SymbolView
            name={{ ios: 'text.badge.plus', android: 'playlist_add', web: 'playlist_add' }}
            size={14}
            tintColor={theme.textSecondary}
          />
        </ThemedView>
      </Pressable>

      <CourseListPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
