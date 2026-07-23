import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/components/course-card';
import { CreatedByBanner } from '@/components/created-by-banner';
import { LocationButton } from '@/components/location-button';
import { SortControl } from '@/components/sort-control';
import { StartTimeButton } from '@/components/start-time-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { golfCourses } from '@/data/golf-courses';
import { floorToHour } from '@/hooks/use-bookmarks';
import { useHasHydrated } from '@/hooks/use-color-scheme';
import { useCourseSort } from '@/hooks/use-course-sort';
import { useCoursesWeather } from '@/hooks/use-courses-weather';
import { useCurrentHour } from '@/hooks/use-current-hour';
import { useDarkScoring } from '@/hooks/use-dark-scoring';
import { useFavorites } from '@/hooks/use-favorites';
import { useLocation } from '@/hooks/use-location';
import { useSortedCourseOrder } from '@/hooks/use-sorted-course-order';
import { resolveNow, useStartTime } from '@/hooks/use-start-time';
import { useTheme } from '@/hooks/use-theme';
import { useWebPullToRefresh } from '@/hooks/use-web-pull-to-refresh';
import { useWindLabels } from '@/hooks/use-wind-labels';
import { useI18n } from '@/i18n';
import { WINDOW_HOURS, currentPlayability } from '@/lib/course-sort';
import { sortByDistance, type GolfCourseWithDistance } from '@/lib/geo';
import { EMPTY_SUN_TIMES, getSunTimes } from '@/lib/sun';
import { findCurrentPoint, hasHourlyData } from '@/lib/weather';

const NEXT_HOURS_SHOWN = WINDOW_HOURS;

export default function FavoritesScreen() {
  const { coords, loading: locationLoading, deviceMovedFar, refresh } = useLocation();
  const { favorites } = useFavorites();
  const { sortMode, setSortMode } = useCourseSort();
  const { darkScoringEnabled } = useDarkScoring();
  const { windLabelsEnabled } = useWindLabels();
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
  const {
    weatherByCourse,
    refresh: refreshWeather,
    refreshing: weatherRefreshing,
  } = useCoursesWeather(coursesByDistance, hourTick);
  const onPullRefresh = useCallback(() => {
    refreshWeather();
    refresh();
  }, [refreshWeather, refresh]);
  const listRef = useRef<FlatList>(null);
  const { indicator: pullToRefreshIndicator } = useWebPullToRefresh({
    scrollRef: listRef,
    onRefresh: onPullRefresh,
    refreshing: weatherRefreshing || locationLoading,
  });
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
        {pullToRefreshIndicator}
        <FlatList
          ref={listRef}
          data={sortedCourses}
          keyExtractor={(item) => item.id}
          extraData={listExtraData}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={weatherRefreshing || locationLoading}
              onRefresh={onPullRefresh}
            />
          }
          ListHeaderComponent={
            <ThemedView style={styles.headerBlock}>
              <CreatedByBanner />
              <View style={styles.buttonRow}>
                <LocationButton />
                <View style={styles.startTimeSlot}>
                  <StartTimeButton />
                </View>
              </View>
              <SortControl value={sortMode} onChange={setSortMode} />
              {(deviceMovedFar || orderIsStale) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={deviceMovedFar ? t('courses.locationMoved') : t('courses.refreshOrder')}
                  style={({ pressed }) => [styles.refreshOrderButton, pressed && styles.refreshOrderButtonPressed]}
                  onPress={deviceMovedFar ? refresh : refreshOrder}>
                  <SymbolView
                    name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                    size={14}
                    tintColor={theme.textSecondary}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {deviceMovedFar ? t('courses.locationMoved') : t('courses.refreshOrder')}
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
            const playability = currentPlayability(
              entry,
              item.lat,
              item.lon,
              now,
              darkScoringEnabled,
              windLabelsEnabled,
            );
            const sun = hasHydrated ? getSunTimes(item.lat, item.lon) : EMPTY_SUN_TIMES;
            const dailyOnly = !!entry?.weather && !hasHourlyData(entry.weather.sources);

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
                dailyOnly={dailyOnly}
                bookmarkDateTime={floorToHour(now)}
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
    gap: Spacing.two,
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  startTimeSlot: {
    flex: 1,
  },
});
