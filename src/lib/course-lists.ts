import type { TranslationKey } from '@/i18n/types';

/** Membership programmes / course networks a course can belong to. */
export type CourseListId = 'kultakortti' | 'jarvi-suomi' | 'golfamore';

export type CourseList = {
  id: CourseListId;
  labelKey: TranslationKey;
};

export const COURSE_LISTS: CourseList[] = [
  { id: 'kultakortti', labelKey: 'courseLists.kultakortti' },
  { id: 'jarvi-suomi', labelKey: 'courseLists.jarviSuomi' },
  { id: 'golfamore', labelKey: 'courseLists.golfamore' },
];
