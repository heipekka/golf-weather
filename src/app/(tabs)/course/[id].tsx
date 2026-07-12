import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useRef } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { BackButton } from "@/components/back-button";
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
import { formatDate, formatDistance, formatHour } from "@/lib/format";
import { haversineKm } from "@/lib/geo";
import { getSunTimes } from "@/lib/sun";
import { findCurrentPoint, hasHourlyData } from "@/lib/weather";

const HOURS_SHOWN = 12;

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = getCourseById(id);
  const { coords } = useLocation();
  const { darkScoringEnabled } = useDarkScoring();
  const { t, locale } = useI18n();
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
  const sun =
    course && hasHydrated ? getSunTimes(course.lat, course.lon) : null;
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
            title: t("courseDetail.courseNotFound"),
            headerTitleAlign: "center",
            headerLeft: () => (
              <BackButton
                accessibilityLabel={t("courseDetail.backToCourses")}
                fallbackHref="/courses"
              />
            ),
            headerLeftContainerStyle: styles.headerSideContainer,
            headerRightContainerStyle: styles.headerSideContainer,
          }}
        />
        <ThemedText type="default" style={styles.notFound}>
          {t("courseDetail.courseNotFoundBody")}
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
          headerLeft: () => (
            <BackButton
              accessibilityLabel={t("courseDetail.backToCourses")}
              fallbackHref="/courses"
            />
          ),
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
          <View style={styles.headerColumns}>
            <View style={styles.headerColumnLeft}>
              <ThemedText type="small" themeColor="textSecondary">
                {course.city}
                {distanceKm !== null
                  ? ` · ${formatDistance(distanceKm)} ${t("courseDetail.away")}`
                  : ""}
              </ThemedText>

              <WeatherSummary
                temperature={currentPoint?.temperature ?? null}
                apparentTemperature={currentPoint?.apparentTemperature ?? null}
                windSpeed={currentPoint?.windSpeed ?? null}
                precipitation={currentPoint?.precipitation ?? null}
                cloudCover={currentPoint?.cloudCover ?? null}
                size="large"
                loading={loading && !weather}
              />
            </View>

            <View style={styles.headerColumnRight}>
              {!dailyOnly && upcoming.length > 0 && (
                <View style={styles.forecastRangeBlock}>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.forecastRangeText}
                  >
                    {`${formatDate(upcoming[0].time, locale)} ${formatHour(upcoming[0].time, locale)}`}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.forecastRangeText}
                  >
                    {t("courseDetail.forecastRange", {
                      count: upcoming.length,
                    })}
                  </ThemedText>
                </View>
              )}
              <View style={styles.badgeCenter}>
                {playability && <PlayabilityBadge playability={playability} />}
              </View>
            </View>
          </View>

          {playability && playability.reasons.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {playability.reasons
                .map((reason) => t(`playability.reasons.${reason}`))
                .join(", ")}
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
                {t("courseDetail.hourlyUnavailable")}
              </ThemedText>
            </View>
          </ThemedView>
        ) : (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {t("courseDetail.nextHours")}
              </ThemedText>
              {upcoming.length === 0 && !loading ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t("courseDetail.noForecastData")}
                </ThemedText>
              ) : (
                <View style={styles.hourlyBleed}>
                  <HourlyStrip
                    points={upcoming}
                    lat={course.lat}
                    lon={course.lon}
                  />
                </View>
              )}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={styles.cardTitle}>
                {t("courseDetail.bySource")}
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
          {t("courseDetail.attribution")}
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
  headerColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: Spacing.two,
  },
  headerColumnLeft: {
    flex: 1,
    gap: Spacing.one,
  },
  headerColumnRight: {
    flexShrink: 0,
    alignItems: "flex-end",
  },
  forecastRangeBlock: {
    flexShrink: 0,
    alignItems: "flex-end",
  },
  badgeCenter: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  forecastRangeText: {
    textAlign: "right",
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
  headerSideContainer: {
    paddingHorizontal: Spacing.three,
  },
});
