import type { GolfCourse } from '@/lib/geo';

import rawCourses from './golf-courses.json';

export const golfCourses: GolfCourse[] = rawCourses;

export function getCourseById(id: string): GolfCourse | undefined {
  return golfCourses.find((course) => course.id === id);
}
