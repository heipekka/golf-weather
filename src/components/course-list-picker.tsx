import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { DialogSurface } from './dialog-surface';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { coursesInList } from '@/data/golf-courses';
import { useFavorites } from '@/hooks/use-favorites';
import { useI18n } from '@/i18n';
import { COURSE_LISTS } from '@/lib/course-lists';

type CourseListPickerProps = {
  visible: boolean;
  onClose: () => void;
};

/** Bulk-adds a preset course collection (a membership programme) to favorites.
 * Add-only by design: picking a list never removes courses, so a mistap can't
 * wipe favorites the user curated by hand. */
export function CourseListPicker({ visible, onClose }: CourseListPickerProps) {
  const { t } = useI18n();
  const { favorites, addFavorites } = useFavorites();

  const lists = useMemo(
    () =>
      COURSE_LISTS.map((list) => {
        const courseIds = coursesInList(list.id).map((course) => course.id);
        return {
          ...list,
          courseIds,
          addedCount: courseIds.filter((id) => favorites.includes(id)).length,
        };
      }),
    [favorites]
  );

  function handleSelect(courseIds: string[]) {
    addFavorites(courseIds);
    onClose();
  }

  return (
    <DialogSurface visible={visible} onClose={onClose} dismissLabel={t('courseLists.title')}>
      <ThemedText type="smallBold">{t('courseLists.title')}</ThemedText>

      {lists.map((list) => {
        const complete = list.addedCount === list.courseIds.length;
        return (
          <Pressable
            key={list.id}
            accessibilityRole="button"
            accessibilityLabel={t(list.labelKey)}
            disabled={complete}
            onPress={() => handleSelect(list.courseIds)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <ThemedView
              type="backgroundElement"
              style={[styles.row, complete && styles.rowComplete]}
            >
              <ThemedText type="small">{t(list.labelKey)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('courseLists.added', {
                  count: list.addedCount,
                  total: list.courseIds.length,
                })}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </DialogSurface>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  rowComplete: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
});
