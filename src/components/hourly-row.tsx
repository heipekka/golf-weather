import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { WeatherIcon, type WeatherConditionInput } from './weather-icon';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { formatHour, formatPrecipitation, formatTemperature, formatWind } from '@/lib/format';

export type HourlyRowProps = WeatherConditionInput & {
  time: string;
  temperature: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  isNight?: boolean;
};

export function HourlyRow({
  time,
  temperature,
  windSpeed,
  precipitation,
  weatherCode,
  cloudCover,
  isNight,
}: HourlyRowProps) {
  const { locale } = useI18n();

  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.time}>
        {formatHour(time, locale)}
      </ThemedText>
      <WeatherIcon
        weatherCode={weatherCode}
        precipitation={precipitation}
        cloudCover={cloudCover}
        size={22}
        isNight={isNight}
      />
      <ThemedText type="smallBold" style={styles.temp}>
        {formatTemperature(temperature)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.wind}>
        {formatWind(windSpeed)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.precip}>
        {formatPrecipitation(precipitation)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  time: {
    width: 52,
  },
  temp: {
    width: 40,
  },
  wind: {
    width: 68,
  },
  precip: {
    flex: 1,
    textAlign: 'right',
  },
});
