import { Link, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/components/course-card';
import { CourseSearchBar } from '@/components/course-search-bar';
import { CreatedByBanner } from '@/components/created-by-banner';
import { DistanceButton } from '@/components/distance-button';
import { LocationButton } from '@/components/location-button';
import { SortControl } from '@/components/sort-control';
import { StartTimeButton } from '@/components/start-time-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { golfCourses } from '@/data/golf-courses';
import { useHasHydrated } from '@/hooks/use-color-scheme';
import { useCourseSort, useSortModeUrlSync } from '@/hooks/use-course-sort';
import { useCoursesWeather } from '@/hooks/use-courses-weather';
import { useCurrentHour } from '@/hooks/use-current-hour';
import { useDarkScoring } from '@/hooks/use-dark-scoring';
import { useDistanceFilter } from '@/hooks/use-distance-filter';
import { useLocation } from '@/hooks/use-location';
import { useSortedCourseOrder } from '@/hooks/use-sorted-course-order';
import { resolveNow, useStartTime } from '@/hooks/use-start-time';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { WINDOW_HOURS, currentPlayability } from '@/lib/course-sort';
import { sortByDistance, type GolfCourseWithDistance } from '@/lib/geo';
import { EMPTY_SUN_TIMES, getSunTimes } from '@/lib/sun';
import { findCurrentPoint, hasHourlyData } from '@/lib/weather';

const NEXT_HOURS_SHOWN = WINDOW_HOURS;

// How many courses are rendered initially / added per `onEndReached` page.
// Weather is still fetched for the full list up front (see
// `useCoursesWeather` below) — this only limits how many cards are mounted
// at once, since rendering all ~99 at once is the actual perf cost.
const PAGE_SIZE = 15;

export default function CoursesScreen() {
  const { coords, loading: locationLoading, deviceMovedFar, refresh } = useLocation();
  const { sortMode, setSortMode } = useCourseSort();
  useSortModeUrlSync();
  const { darkScoringEnabled } = useDarkScoring();
  const { maxDistanceKm } = useDistanceFilter();
  const { t } = useI18n();
  const theme = useTheme();
  const hourTick = useCurrentHour();
  const hasHydrated = useHasHydrated();
  const { startTime } = useStartTime();
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hourTick is a deliberate recompute trigger, not read inside.
  const now = useMemo(() => resolveNow(startTime), [startTime, hourTick]);

  const coursesByDistance = useMemo(
    () => sortByDistance(golfCourses, { lat: coords.lat, lon: coords.lon }),
    [coords.lat, coords.lon]
  );
  const coursesInRange = useMemo(
    () => coursesByDistance.filter((c) => c.distanceKm <= maxDistanceKm),
    [coursesByDistance, maxDistanceKm]
  );
  const weatherByCourse = useCoursesWeather(coursesInRange, hourTick);
  const { sortedCourses, orderIsStale, refreshOrder } = useSortedCourseOrder(
    coursesInRange,
    weatherByCourse,
    sortMode,
    startTime,
    darkScoringEnabled
  );
  const listExtraData = useMemo(
    () => ({ weatherByCourse, hourTick, hasHydrated, startTime, darkScoringEnabled }),
    [weatherByCourse, hourTick, hasHydrated, startTime, darkScoringEnabled]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCourses = useMemo(
    () =>
      normalizedQuery
        ? sortedCourses.filter(
            (course) =>
              course.name.toLowerCase().includes(normalizedQuery) ||
              course.city.toLowerCase().includes(normalizedQuery)
          )
        : sortedCourses,
    [sortedCourses, normalizedQuery]
  );

  // Render-only pagination: `filteredCourses` is already fully fetched and
  // ranked/filtered, this just limits how many cards are mounted at a time.
  // Resets to the first page when the ranking/filtering basis changes (sort
  // mode, preview time, or search query), so switching sort or searching
  // shows the new top of the list. Adjusted during render (React's
  // recommended pattern for derived state) rather than in an effect, to
  // avoid an extra commit.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pageResetKey, setPageResetKey] = useState({ sortMode, startTime, searchQuery });
  if (
    pageResetKey.sortMode !== sortMode ||
    pageResetKey.startTime !== startTime ||
    pageResetKey.searchQuery !== searchQuery
  ) {
    setPageResetKey({ sortMode, startTime, searchQuery });
    setVisibleCount(PAGE_SIZE);
  }
  const visibleCourses = useMemo(
    () => filteredCourses.slice(0, visibleCount),
    [filteredCourses, visibleCount]
  );
  const hasMoreCourses = visibleCount < filteredCourses.length;

  const listRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isScrollable = contentSize.height > layoutMeasurement.height + Spacing.four;
    const atBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height < Spacing.four;
    setShowScrollTop(isScrollable && atBottom);
  };
  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('app.title'),
          headerTitleAlign: 'center',
          headerRight: () => (
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
          ),
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={listRef}
          data={visibleCourses}
          keyExtractor={(item) => item.id}
          extraData={listExtraData}
          style={[styles.list, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={locationLoading} onRefresh={refresh} />}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredCourses.length));
          }}
          ListFooterComponent={
            hasMoreCourses ? (
              <View style={styles.listLoadingFooter}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : filteredCourses.length > 0 ? (
              <View style={styles.listFooter}>
                <View style={[styles.listFooterLine, { borderTopColor: theme.textSecondary }]} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.listFooterText}>
                  {t('distance.label').replace('{km}', String(maxDistanceKm))}
                </ThemedText>
                <View style={[styles.listFooterLine, { borderTopColor: theme.textSecondary }]} />
              </View>
            ) : null
          }
          ListHeaderComponent={
            <ThemedView style={styles.headerBlock}>
              <CreatedByBanner />
              <View style={styles.buttonRow}>
                <LocationButton />
                <DistanceButton />
              </View>
              <StartTimeButton>
                <CourseSearchBar query={searchQuery} onChangeQuery={setSearchQuery} />
              </StartTimeButton>
              <SortControl value={sortMode} onChange={setSortMode} />
              {(deviceMovedFar || orderIsStale) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={deviceMovedFar ? t('courses.locationMoved') : t('courses.refreshOrder')}
                  style={({ pressed }) => [styles.refreshOrderButton, pressed && styles.settingsButtonPressed]}
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
              {coursesInRange.length === 0
                ? t('courses.emptyDistance').replace('{km}', String(maxDistanceKm))
                : t('courses.emptySearch')}
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
              />
            );
          }}
        />
        {showScrollTop && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('courses.scrollToTop')}
            onPress={scrollToTop}
            style={({ pressed }) => [
              styles.scrollTopButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.settingsButtonPressed,
            ]}>
            <SymbolView
              name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
              size={22}
              tintColor={theme.text}
            />
          </Pressable>
        )}
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
  settingsButton: {
    padding: Spacing.one,
  },
  settingsButtonPressed: {
    opacity: 0.6,
  },
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
  refreshOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  listLoadingFooter: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  listFooterLine: {
    flex: 1,
    borderTopWidth: 1,
    borderStyle: 'dotted',
  },
  listFooterText: {
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  scrollTopButton: {
    position: 'absolute',
    right: Spacing.three,
    bottom: BottomTabInset + Spacing.three,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
