import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
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
import { SUBTITLE_KEY_BY_MODE, useCourseSort, useSortModeUrlSync } from '@/hooks/use-course-sort';
import { useCoursesWeather } from '@/hooks/use-courses-weather';
import { useCurrentHour } from '@/hooks/use-current-hour';
import { useDarkScoring } from '@/hooks/use-dark-scoring';
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

// How many courses are rendered initially / added per `onEndReached` page.
// Weather is still fetched for the full list up front (see
// `useCoursesWeather` below) — this only limits how many cards are mounted
// at once, since rendering all ~99 at once is the actual perf cost.
const PAGE_SIZE = 15;

export default function CoursesScreen() {
  const { coords, loading: locationLoading, permissionDenied, isFallback, source, refresh } = useLocation();
  const { sortMode, setSortMode } = useCourseSort();
  useSortModeUrlSync();
  const { darkScoringEnabled } = useDarkScoring();
  const { t } = useI18n();
  const theme = useTheme();
  const hourTick = useCurrentHour();
  const hasHydrated = useHasHydrated();
  const { startTime } = useStartTime();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hourTick is a deliberate recompute trigger, not read inside.
  const now = useMemo(() => resolveNow(startTime), [startTime, hourTick]);

  const coursesByDistance = useMemo(
    () => sortByDistance(golfCourses, { lat: coords.lat, lon: coords.lon }),
    [coords.lat, coords.lon]
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

  // Render-only pagination: `sortedCourses` is already fully fetched and
  // ranked, this just limits how many cards are mounted at a time. Resets
  // to the first page when the ranking basis changes (sort mode or preview
  // time), so switching sort shows the new top of the list. Adjusted
  // during render (React's recommended pattern for derived state) rather
  // than in an effect, to avoid an extra commit.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pageResetKey, setPageResetKey] = useState({ sortMode, startTime });
  if (pageResetKey.sortMode !== sortMode || pageResetKey.startTime !== startTime) {
    setPageResetKey({ sortMode, startTime });
    setVisibleCount(PAGE_SIZE);
  }
  const visibleCourses = useMemo(
    () => sortedCourses.slice(0, visibleCount),
    [sortedCourses, visibleCount]
  );
  const hasMoreCourses = visibleCount < sortedCourses.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={visibleCourses}
          keyExtractor={(item) => item.id}
          extraData={listExtraData}
          style={[styles.list, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={locationLoading} onRefresh={refresh} />}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            setVisibleCount((count) => Math.min(count + PAGE_SIZE, sortedCourses.length));
          }}
          ListFooterComponent={
            hasMoreCourses ? (
              <View style={styles.listFooter}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
          ListHeaderComponent={
            <ThemedView style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <ThemedText type="title" style={styles.title}>
                  {t('app.title')}
                </ThemedText>
                <Link href="/settings" asChild>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('courses.openSettings')}
                    hitSlop={Spacing.two}
                    style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}>
                    <SymbolView
                      name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
                      size={24}
                      tintColor={theme.textSecondary}
                    />
                  </Pressable>
                </Link>
              </View>
              <CreatedByBanner />
              <StartTimeButton />
              <SortControl value={sortMode} onChange={setSortMode} />
              <ThemedText type="small" themeColor="textSecondary">
                {isFallback
                  ? permissionDenied
                    ? source === 'saved'
                      ? t('courses.locationSaved')
                      : t('courses.locationDenied')
                    : t('courses.locationLoading')
                  : t(SUBTITLE_KEY_BY_MODE[sortMode])}
              </ThemedText>
              {orderIsStale && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('courses.refreshOrder')}
                  style={({ pressed }) => [styles.refreshOrderButton, pressed && styles.settingsButtonPressed]}
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
    rowGap: Spacing.two,
  },
  headerBlock: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
  },
  settingsButton: {
    padding: Spacing.one,
  },
  settingsButtonPressed: {
    opacity: 0.6,
  },
  refreshOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  listFooter: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
