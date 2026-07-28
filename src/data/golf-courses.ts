import type { CourseListId } from '@/lib/course-lists';
import type { GolfCourse } from '@/lib/geo';

import rawCourses from './golf-courses.json';

// The JSON import widens `lists` to `string[]`, so the union has to be reasserted here.
export const golfCourses = rawCourses as GolfCourse[];

export function getCourseById(id: string): GolfCourse | undefined {
  return golfCourses.find((course) => course.id === id);
}

export function coursesInList(listId: CourseListId): GolfCourse[] {
  return golfCourses.filter((course) => course.lists?.includes(listId));
}
