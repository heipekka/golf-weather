import { useMemo } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";
import { useDarkScoring } from "@/hooks/use-dark-scoring";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import {
  formatHour,
  formatPrecipitation,
  formatTemperature,
  formatWind,
} from "@/lib/format";
import { PlayabilityColors, scorePlayability } from "@/lib/golf";
import { isNight } from "@/lib/sun";
import type { SourceForecast, SourceId } from "@/lib/weather";
import { indexByHour } from "@/lib/weather";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { WeatherIcon } from "./weather-icon";

const SHORT_LABELS: Record<SourceId, string> = {
  fmi: "FMI",
  yr: "YR.no",
  openmeteo: "Open-Meteo",
};

const TIME_COLUMN_WIDTH = 76;

export type SourceComparisonTableProps = {
  sources: SourceForecast[];
  hours: string[];
  lat: number;
  lon: number;
};

/** Side-by-side hourly comparison: one column per source, one row per hour. */
export function SourceComparisonTable({
  sources,
  hours,
  lat,
  lon,
}: SourceComparisonTableProps) {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const { darkScoringEnabled } = useDarkScoring();
  const indexed = useMemo(
    () =>
      sources.map((source) => ({ source, byHour: indexByHour(source.hourly) })),
    [sources],
  );

  if (hours.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        {t("sourceTable.noForecastData")}
      </ThemedText>
    );
  }

  return (
    <View style={styles.table}>
      <ThemedView
        type="backgroundElement"
        style={[styles.row, styles.headerRow]}
      >
        <View style={[styles.cell, styles.timeColumn]} />
        {indexed.map(({ source }) => (
          <View key={source.source} style={[styles.cell, styles.sourceColumn]}>
            <ThemedText type="smallBold" style={styles.providerLabel}>
              {SHORT_LABELS[source.source]}
            </ThemedText>
            {source.error && (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={1}
              >
                {t("sourceTable.unavailable")}
              </ThemedText>
            )}
          </View>
        ))}
      </ThemedView>

      {hours.map((hour, index) => {
        const night = isNight(hour, lat, lon);
        const isLastRow = index === hours.length - 1;

        return (
          <View
            key={hour}
            style={[
              styles.row,
              !isLastRow && styles.bodyRow,
              !isLastRow && { borderColor: theme.textSecondary },
            ]}
          >
            <View style={[styles.cell, styles.timeColumn]}>
              <ThemedText type="smallBold" style={styles.timeText}>
                {formatHour(hour, locale)}
              </ThemedText>
            </View>
            {indexed.map(({ source, byHour }) => {
              const point = byHour.get(hour);
              const playability = point
                ? scorePlayability({
                    temperature: point.temperature,
                    windSpeed: point.windSpeed,
                    windGust: point.windGust,
                    precipitation: point.precipitation,
                    precipitationProbability: point.precipitationProbability,
                    cloudCover: point.cloudCover,
                    isDark: darkScoringEnabled && night,
                  })
                : null;

              return (
                <View
                  key={source.source}
                  style={[styles.cell, styles.sourceColumn]}
                >
                  {point ? (
                    <>
                      <View style={styles.iconTempRow}>
                        <WeatherIcon
                          weatherCode={point.weatherCode}
                          precipitation={point.precipitation}
                          cloudCover={point.cloudCover}
                          size={18}
                          isNight={night}
                        />
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {formatTemperature(point.temperature)}
                        </ThemedText>
                      </View>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={1}
                      >
                        {formatWind(point.windSpeed)}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={1}
                      >
                        {formatPrecipitation(point.precipitation)}
                      </ThemedText>
                      {playability && (
                        <ThemedText
                          type="small"
                          numberOfLines={1}
                          style={[
                            styles.playability,
                            { color: PlayabilityColors[playability.label] },
                          ]}
                        >
                          {t(`playability.labels.${playability.label}`)}
                        </ThemedText>
                      )}
                    </>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">
                      --
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#808080",
    ...(Platform.OS === "web"
      ? ({ position: "sticky", top: -2, zIndex: 1 } as ViewStyle)
      : null),
  },
  bodyRow: {
    borderBottomWidth: 1,
    borderStyle: "dotted",
  },
  cell: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    justifyContent: "center",
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    flexShrink: 0,
    justifyContent: "center",
    paddingHorizontal: Spacing.one,
  },
  timeText: {
    fontSize: 16,
    lineHeight: 20,
  },
  providerLabel: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
  },
  sourceColumn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.half,
  },
  iconTempRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  playability: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
});
