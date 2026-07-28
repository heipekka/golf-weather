import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { getCourseById } from '@/data/golf-courses';
import { useCourseListLabels } from '@/hooks/use-course-list-labels';
import { useI18n } from '@/i18n';
import { COURSE_LISTS } from '@/lib/course-lists';

/** Shows which membership programmes a course belongs to. Renders nothing when
 * the user has hidden the labels or the course isn't part of any programme. */
export function CourseListLabels({ courseId }: { courseId: string }) {
  const { t } = useI18n();
  const { courseListLabelsEnabled } = useCourseListLabels();
  const lists = getCourseById(courseId)?.lists;

  if (!courseListLabelsEnabled || !lists?.length) return null;

  // Driven by COURSE_LISTS rather than the course's own array so the chips
  // always appear in the same order, whatever order the data happens to use.
  const shown = COURSE_LISTS.filter((list) => lists.includes(list.id));

  return (
    <View style={styles.row}>
      {shown.map((list) => (
        <ThemedView key={list.id} type="backgroundSelected" style={styles.chip}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.chipText}>
            {t(list.labelKey)}
          </ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.five,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 18,
  },
});
