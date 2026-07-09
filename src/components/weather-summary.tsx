import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { WeatherIcon, type WeatherConditionInput } from './weather-icon';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { formatPrecipitation, formatTemperature, formatWind } from '@/lib/format';

export type WeatherSummaryProps = WeatherConditionInput & {
  temperature: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  size?: 'compact' | 'large';
  loading?: boolean;
};

export function WeatherSummary({
  temperature,
  windSpeed,
  precipitation,
  weatherCode,
  cloudCover,
  size = 'compact',
  loading,
}: WeatherSummaryProps) {
  const { t } = useI18n();
  const isLarge = size === 'large';

  return (
    <View style={styles.row}>
      <WeatherIcon
        weatherCode={weatherCode}
        precipitation={precipitation}
        cloudCover={cloudCover}
        size={isLarge ? 44 : 28}
      />
      <View style={styles.stats}>
        <ThemedText type={isLarge ? 'title' : 'subtitle'} style={isLarge ? styles.tempLarge : styles.temp}>
          {loading ? '…' : formatTemperature(temperature)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {loading
            ? t('weatherSummary.loadingForecast')
            : t('weatherSummary.windAndPrecipitation', {
                wind: formatWind(windSpeed),
                precipitation: formatPrecipitation(precipitation),
              })}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stats: {
    gap: Spacing.half,
  },
  temp: {
    fontSize: 28,
    lineHeight: 32,
  },
  tempLarge: {
    fontSize: 40,
    lineHeight: 44,
  },
});
