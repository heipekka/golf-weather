import { useEffect, useMemo, useRef, useState } from 'react';

import type { CourseWeatherState } from '@/hooks/use-courses-weather';
import { resolveNow } from '@/hooks/use-start-time';
import { sortCourses } from '@/lib/course-sort';
import type { GolfCourseWithDistance } from '@/lib/geo';

function sameOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export type UseSortedCourseOrderResult = {
  sortedCourses: GolfCourseWithDistance[];
  orderIsStale: boolean;
  refreshOrder: () => void;
};

/**
 * Ranks `coursesByDistance` for the current `weatherWeight` and latest
 * weather. While the weight brings any weather influence (`> 0`) the list is
 * still streaming in results and the re-rank is applied immediately; once
 * loaded it's only applied on demand (via `refreshOrder`), so the list
 * doesn't reshuffle on its own once the user has seen an ordering — e.g.
 * after an hourly rollover refetch. A deliberate `startTime` change (picking
 * a new date/time) is treated like a weight change instead: the new order is
 * applied immediately since the user just asked to preview a different
 * moment.
 */
export function useSortedCourseOrder(
  coursesByDistance: GolfCourseWithDistance[],
  weatherByCourse: Record<string, CourseWeatherState>,
  weatherWeight: number,
  startTime: Date | null,
  includeDark = true
): UseSortedCourseOrderResult {
  const candidateOrder = useMemo(
    () => sortCourses(coursesByDistance, weatherByCourse, weatherWeight, resolveNow(startTime), includeDark),
    [coursesByDistance, weatherByCourse, weatherWeight, startTime, includeDark]
  );
  const candidateOrderIds = useMemo(() => candidateOrder.map((course) => course.id), [candidateOrder]);
  const courseIdsKey = useMemo(() => coursesByDistance.map((course) => course.id).join(','), [coursesByDistance]);
  const allWeatherLoaded = useMemo(
    () =>
      coursesByDistance.length > 0 &&
      coursesByDistance.every((course) => {
        const entry = weatherByCourse[course.id];
        return !!entry && !entry.loading;
      }),
    [coursesByDistance, weatherByCourse]
  );

  const [displayOrder, setDisplayOrder] = useState<string[]>(() => candidateOrderIds);
  const [orderFrozen, setOrderFrozen] = useState(false);
  const prevWeatherWeightRef = useRef(weatherWeight);
  const prevCourseIdsKeyRef = useRef(courseIdsKey);
  const startTimeKey = startTime ? startTime.getTime() : null;
  const prevStartTimeKeyRef = useRef(startTimeKey);
  const prevIncludeDarkRef = useRef(includeDark);

  useEffect(() => {
    const weightChanged = weatherWeight !== prevWeatherWeightRef.current;
    const idsChanged = courseIdsKey !== prevCourseIdsKeyRef.current;
    const startTimeChanged = startTimeKey !== prevStartTimeKeyRef.current;
    const includeDarkChanged = includeDark !== prevIncludeDarkRef.current;
    prevWeatherWeightRef.current = weatherWeight;
    prevCourseIdsKeyRef.current = courseIdsKey;
    prevStartTimeKeyRef.current = startTimeKey;
    prevIncludeDarkRef.current = includeDark;

    if (weatherWeight === 0) {
      setDisplayOrder(candidateOrderIds);
      if (orderFrozen) setOrderFrozen(false);
      return;
    }

    if (weightChanged || idsChanged || startTimeChanged || includeDarkChanged) {
      setDisplayOrder(candidateOrderIds);
      if (orderFrozen) setOrderFrozen(false);
      return;
    }

    if (!orderFrozen) {
      setDisplayOrder(candidateOrderIds);
      if (allWeatherLoaded) setOrderFrozen(true);
    }
  }, [candidateOrderIds, weatherWeight, courseIdsKey, startTimeKey, includeDark, allWeatherLoaded, orderFrozen]);

  const courseById = useMemo(
    () => new Map(coursesByDistance.map((course) => [course.id, course])),
    [coursesByDistance]
  );
  const sortedCourses = useMemo(
    () =>
      displayOrder
        .map((id) => courseById.get(id))
        .filter((course): course is GolfCourseWithDistance => !!course),
    [displayOrder, courseById]
  );
  const orderIsStale = weatherWeight !== 0 && orderFrozen && !sameOrder(candidateOrderIds, displayOrder);

  return {
    sortedCourses,
    orderIsStale,
    refreshOrder: () => setDisplayOrder(candidateOrderIds),
  };
}
