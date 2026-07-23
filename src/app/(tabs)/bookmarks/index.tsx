import { Link, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { CourseCard } from '@/components/course-card';
import { CourseSearchBar } from '@/components/course-search-bar';
import { CreatedByBanner } from '@/components/created-by-banner';
import { LocationButton } from '@/components/location-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getCourseById } from '@/data/golf-courses';
import { type Bookmark, floorToHour, useBookmarks } from '@/hooks/use-bookmarks';
import { useHasHydrated } from '@/hooks/use-color-scheme';
import { useCoursesWeather } from '@/hooks/use-courses-weather';
import { useCurrentHour } from '@/hooks/use-current-hour';
import { useDarkScoring } from '@/hooks/use-dark-scoring';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { useWebPullToRefresh } from '@/hooks/use-web-pull-to-refresh';
import { useWindLabels } from '@/hooks/use-wind-labels';
import { useI18n } from '@/i18n';
import { WINDOW_HOURS, currentPlayability } from '@/lib/course-sort';
import { sortByDistance, type GolfCourse, type GolfCourseWithDistance } from '@/lib/geo';
import { EMPTY_SUN_TIMES, getSunTimes } from '@/lib/sun';
import { findCurrentPoint, hasHourlyData } from '@/lib/weather';

const NEXT_HOURS_SHOWN = WINDOW_HOURS;

type BookmarkEntry = {
  bookmark: Bookmark;
  course: GolfCourseWithDistance;
};

export default function BookmarksScreen() {
  const { coords, loading: locationLoading, refresh } = useLocation();
  const { bookmarks, pruneExpired, removeBookmark } = useBookmarks();
  const { darkScoringEnabled } = useDarkScoring();
  const { windLabelsEnabled } = useWindLabels();
  const { t } = useI18n();
  const theme = useTheme();
  const hourTick = useCurrentHour();
  const hasHydrated = useHasHydrated();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<Bookmark | null>(null);

  // Prunes bookmarks whose datetime has already passed, both on mount and
  // whenever the app's "current hour" rolls over.
  useEffect(() => {
    pruneExpired();
  }, [pruneExpired, hourTick]);

  const uniqueCourses = useMemo(() => {
    const seen = new Set<string>();
    const courses: GolfCourse[] = [];
    for (const bookmark of bookmarks) {
      if (seen.has(bookmark.courseId)) continue;
      const course = getCourseById(bookmark.courseId);
      if (!course) continue;
      seen.add(bookmark.courseId);
      courses.push(course);
    }
    return courses;
  }, [bookmarks]);
  const coursesByDistance = useMemo(
    () => sortByDistance(uniqueCourses, { lat: coords.lat, lon: coords.lon }),
    [uniqueCourses, coords.lat, coords.lon]
  );
  const coursesById = useMemo(
    () => new Map(coursesByDistance.map((course) => [course.id, course])),
    [coursesByDistance]
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

  const entries = useMemo<BookmarkEntry[]>(() => {
    const list: BookmarkEntry[] = [];
    for (const bookmark of bookmarks) {
      const course = coursesById.get(bookmark.courseId);
      if (!course) continue;
      list.push({ bookmark, course });
    }
    return list.sort((a, b) => {
      const aIsNow = a.bookmark.isNow ? 0 : 1;
      const bIsNow = b.bookmark.isNow ? 0 : 1;
      if (aIsNow !== bIsNow) return aIsNow - bIsNow;
      if (a.bookmark.isNow) return a.course.distanceKm - b.course.distanceKm;
      return (
        new Date(a.bookmark.datetime ?? '').getTime() -
        new Date(b.bookmark.datetime ?? '').getTime()
      );
    });
  }, [bookmarks, coursesById]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEntries = useMemo(
    () =>
      normalizedQuery
        ? entries.filter(
            (entry) =>
              entry.course.name.toLowerCase().includes(normalizedQuery) ||
              entry.course.city.toLowerCase().includes(normalizedQuery)
          )
        : entries,
    [entries, normalizedQuery]
  );

  const listExtraData = useMemo(
    () => ({ weatherByCourse, hourTick, hasHydrated, darkScoringEnabled }),
    [weatherByCourse, hourTick, hasHydrated, darkScoringEnabled]
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('bookmarks.title'),
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
        {pullToRefreshIndicator}
        <FlatList
          ref={listRef}
          data={filteredEntries}
          keyExtractor={(item) => item.bookmark.id}
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
                <View style={styles.searchSlot}>
                  <CourseSearchBar query={searchQuery} onChangeQuery={setSearchQuery} />
                </View>
              </View>
            </ThemedView>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {entries.length === 0 ? t('bookmarks.empty') : t('courses.emptySearch')}
            </ThemedText>
          }
          renderItem={({ item }: { item: BookmarkEntry }) => {
            const { bookmark, course } = item;
            const bookmarkDateTime = bookmark.isNow
              ? floorToHour(new Date())
              : new Date(bookmark.datetime ?? '');
            const entry = weatherByCourse[course.id];
            const aggregated = entry?.weather?.aggregated ?? [];
            const current = entry?.weather ? findCurrentPoint(aggregated, bookmarkDateTime) : null;
            const startIndex = current ? aggregated.indexOf(current) : 0;
            const hourly = aggregated.slice(
              Math.max(startIndex, 0),
              Math.max(startIndex, 0) + NEXT_HOURS_SHOWN
            );
            const playability = currentPlayability(
              entry,
              course.lat,
              course.lon,
              bookmarkDateTime,
              darkScoringEnabled,
              windLabelsEnabled
            );
            const sun = hasHydrated ? getSunTimes(course.lat, course.lon) : EMPTY_SUN_TIMES;
            const dailyOnly = !!entry?.weather && !hasHourlyData(entry.weather.sources);

            return (
              <CourseCard
                id={course.id}
                name={course.name}
                city={course.city}
                lat={course.lat}
                lon={course.lon}
                distanceKm={course.distanceKm}
                current={current}
                hourly={hourly}
                playability={playability}
                sun={sun}
                loading={!entry || entry.loading}
                dailyOnly={dailyOnly}
                bookmarkDateTime={bookmarkDateTime}
                showBookmarkDateTime
                bookmarkIsNow={bookmark.isNow}
                onRemoveBookmark={() => setPendingRemoval(bookmark)}
                detailHref={{ pathname: '/bookmarks/[id]', params: { id: bookmark.id } }}
              />
            );
          }}
        />
      </SafeAreaView>

      <ConfirmDialog
        visible={!!pendingRemoval}
        title={t('bookmarks.remove')}
        message={t('bookmarks.removeMessage')}
        confirmLabel={t('bookmarks.confirmRemove')}
        cancelLabel={t('bookmarks.cancel')}
        onConfirm={() => {
          if (pendingRemoval) removeBookmark(pendingRemoval.id);
          setPendingRemoval(null);
        }}
        onCancel={() => setPendingRemoval(null)}
      />
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  searchSlot: {
    flex: 1,
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
});
