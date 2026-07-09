import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/components/course-card';
import { CreatedByBanner } from '@/components/created-by-banner';
import { SortControl } from '@/components/sort-control';
import { StartTimeButton } from '@/components/start-time-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { golfCourses } from '@/data/golf-courses';
import { useHasHydrated } from '@/hooks/use-color-scheme';
import { SUBTITLE_KEY_BY_MODE, useCourseSort } from '@/hooks/use-course-sort';
import { useCoursesWeather } from '@/hooks/use-courses-weather';
import { useCurrentHour } from '@/hooks/use-current-hour';
import { useDarkScoring } from '@/hooks/use-dark-scoring';
import { useFavorites } from '@/hooks/use-favorites';
import { useLocation } from '@/hooks/use-location';
import { useSortedCourseOrder } from '@/hooks/use-sorted-course-order';
import { resolveNow, useStartTime } from '@/hooks/use-start-time';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { WINDOW_HOURS, currentPlayability } from '@/lib/course-sort';
import { sortByDistance, type GolfCourseWithDistance } from '@/lib/geo';
import { EMPTY_SUN_TIMES, getSunTimes } from '@/lib/sun';
import { findCurrentPoint } from '@/lib/weather';

const NEXT_HOURS_SHOWN = WINDOW_HOURS;

export default function FavoritesScreen() {
  const { coords, loading: locationLoading, refresh } = useLocation();
  const { favorites } = useFavorites();
  const { sortMode, setSortMode } = useCourseSort();
  const { darkScoringEnabled } = useDarkScoring();
  const { t } = useI18n();
  const theme = useTheme();
  const hourTick = useCurrentHour();
  const hasHydrated = useHasHydrated();
  const { startTime } = useStartTime();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hourTick is a deliberate recompute trigger, not read inside.
  const now = useMemo(() => resolveNow(startTime), [startTime, hourTick]);

  const favoriteCourses = useMemo(
    () => golfCourses.filter((course) => favorites.includes(course.id)),
    [favorites]
  );
  const coursesByDistance = useMemo(
    () => sortByDistance(favoriteCourses, { lat: coords.lat, lon: coords.lon }),
    [favoriteCourses, coords.lat, coords.lon]
  );
  const weatherByCourse = useCoursesWeather(coursesByDistance, hourTick);
  const { sortedCourses, orderIsStale, refreshOrder } = useSortedCourseOrder(
    coursesByDistance,
    weatherByCourse,
    sortMode,
    startTime,
    darkScoringEnabled
  );
  const listExtraData = useMemo(
    () => ({ weatherByCourse, hourTick, hasHydrated, startTime, darkScoringEnabled }),
    [weatherByCourse, hourTick, hasHydrated, startTime, darkScoringEnabled]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={sortedCourses}
          keyExtractor={(item) => item.id}
          extraData={listExtraData}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={locationLoading} onRefresh={refresh} />}
          ListHeaderComponent={
            <ThemedView style={styles.headerBlock}>
              <CreatedByBanner />
              <StartTimeButton />
              <SortControl value={sortMode} onChange={setSortMode} />
              <ThemedText type="small" themeColor="textSecondary">
                {t(SUBTITLE_KEY_BY_MODE[sortMode])}
              </ThemedText>
              {orderIsStale && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('courses.refreshOrder')}
                  style={({ pressed }) => [styles.refreshOrderButton, pressed && styles.refreshOrderButtonPressed]}
                  onPress={refreshOrder}>
                  <SymbolView
                    name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                    size={14}
                    tintColor={theme.textSecondary}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('courses.refreshOrder')}
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {t('favorites.empty')}
            </ThemedText>
          }
          renderItem={({ item }: { item: GolfCourseWithDistance }) => {
            const entry = weatherByCourse[item.id];
            const aggregated = entry?.weather?.aggregated ?? [];
            const current = entry?.weather ? findCurrentPoint(aggregated, now) : null;
            const startIndex = current ? aggregated.indexOf(current) : 0;
            const hourly = aggregated.slice(
              Math.max(startIndex, 0),
              Math.max(startIndex, 0) + NEXT_HOURS_SHOWN
            );
            const playability = currentPlayability(entry, item.lat, item.lon, now, darkScoringEnabled);
            const sun = hasHydrated ? getSunTimes(item.lat, item.lon) : EMPTY_SUN_TIMES;

            return (
              <CourseCard
                id={item.id}
                name={item.name}
                city={item.city}
                lat={item.lat}
                lon={item.lon}
                distanceKm={item.distanceKm}
                current={current}
                hourly={hourly}
                playability={playability}
                sun={sun}
                loading={!entry || entry.loading}
              />
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    rowGap: Spacing.two,
  },
  headerBlock: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingTop: Spacing.four,
  },
  refreshOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  refreshOrderButtonPressed: {
    opacity: 0.6,
  },
});
