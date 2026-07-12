import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import {
  formatDayLabel,
  formatDistance,
  formatHour,
  formatPrecipitationRange,
  formatTemperatureAverage,
  formatWindRange,
} from "@/lib/format";
import type { Playability } from "@/lib/golf";
import type { SunTimes as SunTimesData } from "@/lib/sun";
import type { AggregatedPoint } from "@/lib/weather";
import { BookmarkButton } from "./bookmark-button";
import { FavoriteButton } from "./favorite-button";
import { HourlyStrip } from "./hourly-strip";
import { PlayabilityBadge } from "./playability-badge";
import { SunTimes } from "./sun-times";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { WeatherIcon } from "./weather-icon";

export type CourseCardProps = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  distanceKm: number;
  current: AggregatedPoint | null;
  hourly: AggregatedPoint[];
  playability: Playability | null;
  sun: SunTimesData;
  loading?: boolean;
  /** True when the sources only returned daily (not hourly) data. */
  dailyOnly?: boolean;
  /** When set, shows a bookmark button that adds/removes a bookmark for this course at this datetime. */
  bookmarkDateTime?: Date;
  /** When true, shows `bookmarkDateTime` under the course name (used on the bookmarks list). */
  showBookmarkDateTime?: boolean;
  /** When set, the footer shows only a remove button (calling this) instead of the favorite/bookmark buttons — used on the bookmarks list. */
  onRemoveBookmark?: () => void;
};

export function CourseCard({
  id,
  name,
  city,
  lat,
  lon,
  distanceKm,
  current,
  hourly,
  playability,
  sun,
  loading,
  dailyOnly,
  bookmarkDateTime,
  showBookmarkDateTime,
  onRemoveBookmark,
}: CourseCardProps) {
  const [showHourly, setShowHourly] = useState(false);
  const theme = useTheme();
  const { t, locale } = useI18n();
  const canShowHourly = !loading && !dailyOnly && hourly.length > 1;
  const showDailyOnlyNotice = !loading && !canShowHourly && hourly.length > 0;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Link href={`/course/${id}`} asChild>
        <Pressable style={({ pressed }) => pressed && styles.pressed}>
          {showBookmarkDateTime && bookmarkDateTime && (
            <ThemedText type="smallBold" style={styles.bookmarkHeading} numberOfLines={1}>
              {formatDayLabel(bookmarkDateTime.toISOString(), locale)} {formatHour(bookmarkDateTime.toISOString(), locale)}
            </ThemedText>
          )}

          <View style={styles.nameRow}>
            <ThemedText
              type={showBookmarkDateTime && bookmarkDateTime ? "small" : "smallBold"}
              style={styles.name}
              numberOfLines={1}
            >
              {name}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={[styles.statText, styles.noEllipsis]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {city} · {formatDistance(distanceKm)}
            </ThemedText>
          </View>

          <View style={styles.header}>
            <View style={styles.details}>
              <SunTimes {...sun} variant="compact" />
              {loading ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.statText}
                >
                  {t('courseCard.loadingForecast')}
                </ThemedText>
              ) : (
                <>
                  <View style={styles.statRow}>
                    <SymbolView
                      name={{ ios: "wind", android: "air", web: "air" }}
                      size={12}
                      tintColor={theme.textSecondary}
                    />
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.statText}
                    >
                      {formatWindRange(hourly.map((point) => point.windSpeed))}
                    </ThemedText>
                  </View>
                  <View style={styles.statRow}>
                    <SymbolView
                      name={{
                        ios: "drop.fill",
                        android: "water_drop",
                        web: "water_drop",
                      }}
                      size={12}
                      tintColor={theme.textSecondary}
                    />
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.statText}
                    >
                      {formatPrecipitationRange(hourly.map((point) => point.precipitation))}
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
            <View style={styles.conditions}>
              {playability && <PlayabilityBadge playability={playability} />}
              <View style={styles.tempRow}>
                <WeatherIcon
                  precipitation={current?.precipitation}
                  cloudCover={current?.cloudCover}
                  size={28}
                />
                <ThemedText type="subtitle" style={styles.temp}>
                  {loading
                    ? "…"
                    : formatTemperatureAverage(hourly.map((point) => point.temperature))}
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>
      </Link>

      <View style={styles.footer}>
        {canShowHourly ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              showHourly ? t('courseCard.hideHourlyForecast') : t('courseCard.showHourlyForecast')
            }
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
            onPress={() => setShowHourly((value) => !value)}
          >
            <SymbolView
              name={
                showHourly
                  ? {
                      ios: "chevron.up",
                      android: "expand_less",
                      web: "expand_less",
                    }
                  : {
                      ios: "chevron.down",
                      android: "expand_more",
                      web: "expand_more",
                    }
              }
              size={12}
              weight="bold"
              tintColor={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('courseCard.hourlyForecast')}
            </ThemedText>
          </Pressable>
        ) : showDailyOnlyNotice ? (
          <View style={styles.dailyOnlyNotice}>
            <SymbolView
              name={{ ios: "info.circle", android: "info", web: "info" }}
              size={12}
              tintColor={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('courseCard.hourlyUnavailable')}
            </ThemedText>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.footerButtons}>
          {onRemoveBookmark ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('bookmarks.remove')}
              hitSlop={Spacing.two}
              onPress={onRemoveBookmark}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            >
              <SymbolView
                name={{ ios: "trash", android: "delete", web: "delete" }}
                size={20}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          ) : (
            <>
              <FavoriteButton courseId={id} />
              {bookmarkDateTime && <BookmarkButton courseId={id} datetime={bookmarkDateTime} />}
            </>
          )}
        </View>
      </View>

      {canShowHourly && showHourly && (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={styles.hourlyBleed}
        >
          <HourlyStrip points={hourly} lat={lat} lon={lon} />
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  name: {
    flexShrink: 1,
  },
  bookmarkHeading: {
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  details: {
    flex: 1,
    gap: Spacing.one,
  },
  statText: {
    fontSize: 12,
    lineHeight: 16,
  },
  // react-native-web always renders numberOfLines={1} with CSS
  // text-overflow: ellipsis, ignoring ellipsizeMode. Override it here so the
  // text clips silently instead of showing "…" on web.
  noEllipsis: Platform.select({
    web: { textOverflow: "clip" } as object,
    default: {},
  }),
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  conditions: {
    alignItems: "flex-end",
    gap: Spacing.one,
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  temp: {
    fontSize: 28,
    lineHeight: 32,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.two,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  dailyOnlyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  removeButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  hourlyBleed: {
    marginHorizontal: -Spacing.three,
    marginTop: Spacing.three,
  },
});
