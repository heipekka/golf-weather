import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useRef } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { FavoriteButton } from "@/components/favorite-button";
import { HourlyStrip } from "@/components/hourly-strip";
import { PlayabilityBadge } from "@/components/playability-badge";
import { SourceComparisonTable } from "@/components/source-comparison-table";
import { StartTimeButton } from "@/components/start-time-button";
import { SunTimes } from "@/components/sun-times";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WeatherSummary } from "@/components/weather-summary";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { getCourseById } from "@/data/golf-courses";
import { useHasHydrated } from "@/hooks/use-color-scheme";
import { useCourseWeather } from "@/hooks/use-course-weather";
import { useCurrentHour } from "@/hooks/use-current-hour";
import { useDarkScoring } from "@/hooks/use-dark-scoring";
import { useLocation } from "@/hooks/use-location";
import { resolveNow, useStartTime } from "@/hooks/use-start-time";
import { useTheme } from "@/hooks/use-theme";
import { useWebPullToRefresh } from "@/hooks/use-web-pull-to-refresh";
import { useI18n } from "@/i18n";
import { currentPlayability } from "@/lib/course-sort";
import { formatDistance } from "@/lib/format";
import { haversineKm } from "@/lib/geo";
import { getSunTimes } from "@/lib/sun";
import { findCurrentPoint, hasHourlyData } from "@/lib/weather";

const HOURS_SHOWN = 12;

// Returns to the actual previous screen when there is navigation history
// (e.g. Favorites -> course detail), falling back to the courses list when
// there isn't one, such as when the screen is opened directly via a deep
// link, a web refresh, or as the restored initial route.
function CoursesBackButton() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('courseDetail.backToCourses')}
      hitSlop={Spacing.two}
      onPress={() => (router.canGoBack() ? router.back() : router.dismissTo("/courses"))}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
    >
      <SymbolView
        name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
        size={22}
        tintColor={theme.text}
      />
    </Pressable>
  );
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = getCourseById(id);
  const { coords } = useLocation();
  const { darkScoringEnabled } = useDarkScoring();
  const { t } = useI18n();
  const theme = useTheme();
  const hourTick = useCurrentHour();
  const hasHydrated = useHasHydrated();
  const { startTime } = useStartTime();
  // `hourTick` is included so the "now" fallback (`startTime === null`) advances
  // at each hour rollover, matching the refresh cadence used elsewhere.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hourTick is a deliberate recompute trigger, not read inside.
  const now = useMemo(() => resolveNow(startTime), [startTime, hourTick]);

  const { weather, loading, error, refresh } = useCourseWeather(
    course?.lat ?? 0,
    course?.lon ?? 0,
    hourTick,
  );
  const scrollRef = useRef<ScrollView>(null);
  const { indicator: pullToRefreshIndicator } = useWebPullToRefresh({
    scrollRef,
    onRefresh: refresh,
    refreshing: loading,
  });

  const distanceKm = course ? haversineKm(coords, course) : null;
  const sun = course && hasHydrated ? getSunTimes(course.lat, course.lon) : null;
  const currentPoint = useMemo(
    () => (weather ? findCurrentPoint(weather.aggregated, now) : null),
    [weather, now],
  );
  const playability = currentPlayability(
    { weather, loading, error },
    course?.lat ?? 0,
    course?.lon ?? 0,
    now,
    darkScoringEnabled,
  );

  const upcoming = useMemo(() => {
    if (!weather) return [];
    const startIndex = currentPoint
      ? weather.aggregated.indexOf(currentPoint)
      : 0;
    return weather.aggregated.slice(
      Math.max(startIndex, 0),
      Math.max(startIndex, 0) + HOURS_SHOWN,
    );
  }, [weather, currentPoint]);

  const dailyOnly = useMemo(
    () =>
      !!weather &&
      weather.aggregated.length > 0 &&
      !hasHourlyData(weather.sources),
    [weather],
  );

  if (!course) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: t('courseDetail.courseNotFound'),
            headerTitleAlign: "center",
            headerLeft: () => <CoursesBackButton />,
            headerLeftContainerStyle: styles.headerSideContainer,
            headerRightContainerStyle: styles.headerSideContainer,
          }}
        />
        <ThemedText type="default" style={styles.notFound}>
          {t('courseDetail.courseNotFoundBody')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: course.name,
          headerTitleAlign: "center",
          headerLeft: () => <CoursesBackButton />,
          headerRight: () => <FavoriteButton courseId={course.id} />,
          headerLeftContainerStyle: styles.headerSideContainer,
          headerRightContainerStyle: styles.headerSideContainer,
        }}
      />
      {pullToRefreshIndicator}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <StartTimeButton />

        <View style={styles.headerBlock}>
          <View style={styles.cityRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {course.city}
              {distanceKm !== null
                ? ` · ${formatDistance(distanceKm)} ${t('courseDetail.away')}`
                : ""}
            </ThemedText>

            {!dailyOnly && upcoming.length > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {t('courseDetail.forecastRange', { count: upcoming.length })}
              </ThemedText>
            )}
          </View>

          <View style={styles.summaryRow}>
            <WeatherSummary
              temperature={currentPoint?.temperature ?? null}
              apparentTemperature={currentPoint?.apparentTemperature ?? null}
              windSpeed={currentPoint?.windSpeed ?? null}
              precipitation={currentPoint?.precipitation ?? null}
              cloudCover={currentPoint?.cloudCover ?? null}
              size="large"
              loading={loading && !weather}
            />
            {playability && <PlayabilityBadge playability={playability} />}
          </View>

          {playability && playability.reasons.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {playability.reasons.map((reason) => t(`playability.reasons.${reason}`)).join(", ")}
            </ThemedText>
          )}

          {error && (
            <ThemedText type="small" themeColor="textSecondary">
              {error}
            </ThemedText>
          )}
        </View>

        {sun && <SunTimes {...sun} variant="detailed" />}

        {dailyOnly ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.infoRow}>
              <SymbolView
                name={{ ios: "info.circle", android: "info", web: "info" }}
                size={18}
                tintColor={theme.textSecondary}
              />
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.infoText}
              >
                {t('courseDetail.hourlyUnavailable')}
              </ThemedText>
            </View>
          </ThemedView>
        ) : (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {t('courseDetail.nextHours')}
              </ThemedText>
              {upcoming.length === 0 && !loading ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('courseDetail.noForecastData')}
                </ThemedText>
              ) : (
                <View style={styles.hourlyBleed}>
                  <HourlyStrip points={upcoming} lat={course.lat} lon={course.lon} />
                </View>
              )}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {t('courseDetail.bySource')}
              </ThemedText>
              <SourceComparisonTable
                sources={weather?.sources ?? []}
                hours={upcoming.map((point) => point.time)}
                lat={course.lat}
                lon={course.lon}
              />
            </ThemedView>
          </>
        )}

        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.attribution}
        >
          {t('courseDetail.attribution')}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  headerBlock: {
    gap: Spacing.two,
  },
  cityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: {
    marginBottom: Spacing.half,
  },
  hourlyBleed: {
    marginHorizontal: -Spacing.three,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  infoText: {
    flex: 1,
  },
  attribution: {
    textAlign: "center",
    paddingVertical: Spacing.three,
  },
  notFound: {
    padding: Spacing.four,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
});
