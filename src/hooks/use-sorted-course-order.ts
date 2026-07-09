import { useEffect, useMemo, useRef, useState } from 'react';

import type { CourseWeatherState } from '@/hooks/use-courses-weather';
import { resolveNow } from '@/hooks/use-start-time';
import { sortCourses, type SortMode } from '@/lib/course-sort';
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
 * Ranks `coursesByDistance` for the current `sortMode` and latest weather.
 * While weather/combined mode is still streaming in results the re-rank is
 * applied immediately; once loaded it's only applied on demand (via
 * `refreshOrder`), so the list doesn't reshuffle on its own once the user
 * has seen an ordering — e.g. after an hourly rollover refetch. A deliberate
 * `startTime` change (picking a new date/time) is treated like a sort-mode
 * change instead: the new order is applied immediately since the user just
 * asked to preview a different moment.
 */
export function useSortedCourseOrder(
  coursesByDistance: GolfCourseWithDistance[],
  weatherByCourse: Record<string, CourseWeatherState>,
  sortMode: SortMode,
  startTime: Date | null,
  includeDark = true
): UseSortedCourseOrderResult {
  const candidateOrder = useMemo(
    () => sortCourses(coursesByDistance, weatherByCourse, sortMode, resolveNow(startTime), includeDark),
    [coursesByDistance, weatherByCourse, sortMode, startTime, includeDark]
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
  const prevSortModeRef = useRef(sortMode);
  const prevCourseIdsKeyRef = useRef(courseIdsKey);
  const startTimeKey = startTime ? startTime.getTime() : null;
  const prevStartTimeKeyRef = useRef(startTimeKey);
  const prevIncludeDarkRef = useRef(includeDark);

  useEffect(() => {
    const modeChanged = sortMode !== prevSortModeRef.current;
    const idsChanged = courseIdsKey !== prevCourseIdsKeyRef.current;
    const startTimeChanged = startTimeKey !== prevStartTimeKeyRef.current;
    const includeDarkChanged = includeDark !== prevIncludeDarkRef.current;
    prevSortModeRef.current = sortMode;
    prevCourseIdsKeyRef.current = courseIdsKey;
    prevStartTimeKeyRef.current = startTimeKey;
    prevIncludeDarkRef.current = includeDark;

    if (sortMode === 'location') {
      setDisplayOrder(candidateOrderIds);
      if (orderFrozen) setOrderFrozen(false);
      return;
    }

    if (modeChanged || idsChanged || startTimeChanged || includeDarkChanged) {
      setDisplayOrder(candidateOrderIds);
      if (orderFrozen) setOrderFrozen(false);
      return;
    }

    if (!orderFrozen) {
      setDisplayOrder(candidateOrderIds);
      if (allWeatherLoaded) setOrderFrozen(true);
    }
  }, [candidateOrderIds, sortMode, courseIdsKey, startTimeKey, includeDark, allWeatherLoaded, orderFrozen]);

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
  const orderIsStale = sortMode !== 'location' && orderFrozen && !sameOrder(candidateOrderIds, displayOrder);

  return {
    sortedCourses,
    orderIsStale,
    refreshOrder: () => setDisplayOrder(candidateOrderIds),
  };
}
