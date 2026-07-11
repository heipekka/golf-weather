import { ScrollView, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useDarkScoring } from "@/hooks/use-dark-scoring";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/i18n";
import {
  formatHourShort,
  formatPrecipitation,
  formatTemperature,
  formatWind,
} from "@/lib/format";
import { PlayabilityColors, scorePlayability } from "@/lib/golf";
import { isNight } from "@/lib/sun";
import type { AggregatedPoint } from "@/lib/weather";
import { ThemedText } from "./themed-text";
import { WeatherIcon } from "./weather-icon";

export type HourlyStripProps = {
  points: AggregatedPoint[];
  lat: number;
  lon: number;
};

/** Compact horizontal strip showing the next few hours at a glance. */
export function HourlyStrip({ points, lat, lon }: HourlyStripProps) {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const { darkScoringEnabled } = useDarkScoring();

  if (points.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {points.map((point, index) => {
        const playability = scorePlayability({
          temperature: point.temperature,
          windSpeed: point.windSpeed,
          windGust: point.windGust,
          precipitation: point.precipitation,
          precipitationProbability: point.precipitationProbability,
          cloudCover: point.cloudCover,
          isDark: darkScoringEnabled && isNight(point.time, lat, lon),
        });

        return (
          <View key={point.time} style={styles.column}>
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  { borderTopColor: theme.textSecondary },
                ]}
              />
            )}
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.centeredText}
            >
              {formatHourShort(point.time, locale)}
            </ThemedText>
            <View style={styles.iconRow}>
              <WeatherIcon
                precipitation={point.precipitation}
                cloudCover={point.cloudCover}
                size={18}
                isNight={isNight(point.time, lat, lon)}
              />
              <ThemedText type="smallBold" numberOfLines={1}>
                {formatTemperature(point.temperature)}
              </ThemedText>
            </View>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.centeredText}
            >
              {formatWind(point.windSpeed)}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.centeredText}
            >
              {formatPrecipitation(point.precipitation)}
            </ThemedText>
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[
                styles.playability,
                styles.centeredText,
                { color: PlayabilityColors[playability.label] },
              ]}
            >
              {t(`playability.labels.${playability.label}`)}
            </ThemedText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  column: {
    alignItems: "center",
    gap: Spacing.half,
    width: 64,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
  connector: {
    position: "absolute",
    left: -Spacing.five,
    width: Spacing.five + Spacing.three,
    top: 10,
    borderTopWidth: 1,
    borderStyle: "dotted",
  },
  playability: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
  centeredText: {
    textAlign: "center",
    width: "100%",
  },
});
