import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { formatClock, formatDuration } from '@/lib/format';
import type { SunTimes as SunTimesData } from '@/lib/sun';

export type SunTimesProps = SunTimesData & {
  variant?: 'compact' | 'detailed';
};

export function SunTimes({ sunrise, sunset, dawn, dusk, daylightMinutes, variant = 'compact' }: SunTimesProps) {
  const theme = useTheme();
  const { t, locale } = useI18n();

  if (variant === 'compact') {
    if (!sunrise && !sunset) return null;

    return (
      <View style={styles.compactRow}>
        <SymbolView
          name={{ ios: 'sunrise.fill', android: 'wb_twilight', web: 'wb_twilight' }}
          size={12}
          tintColor={theme.textSecondary}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.compactText}>
          {formatClock(sunrise, locale)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.compactText}>
          ·
        </ThemedText>
        <SymbolView
          name={{ ios: 'sunset.fill', android: 'wb_twilight', web: 'wb_twilight' }}
          size={12}
          tintColor={theme.textSecondary}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.compactText}>
          {formatClock(sunset, locale)}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.detailedRow}>
        <View style={styles.detailedItem}>
          <SymbolView
            name={{ ios: 'sunrise.fill', android: 'wb_twilight', web: 'wb_twilight' }}
            size={20}
            tintColor={theme.text}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {t('sunTimes.sunrise')}
          </ThemedText>
          <ThemedText type="smallBold">{formatClock(sunrise, locale)}</ThemedText>
        </View>

        <View style={styles.detailedItem}>
          <SymbolView
            name={{ ios: 'sunset.fill', android: 'wb_twilight', web: 'wb_twilight' }}
            size={20}
            tintColor={theme.text}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {t('sunTimes.sunset')}
          </ThemedText>
          <ThemedText type="smallBold">{formatClock(sunset, locale)}</ThemedText>
        </View>

        <View style={styles.detailedItem}>
          <SymbolView
            name={{ ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' }}
            size={20}
            tintColor={theme.text}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {t('sunTimes.daylight')}
          </ThemedText>
          <ThemedText type="smallBold">
            {formatDuration(daylightMinutes, { hour: t('format.hourUnit'), minute: t('format.minuteUnit') })}
          </ThemedText>
        </View>
      </View>

      {(dawn || dusk) && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('sunTimes.playableLight', { dawn: formatClock(dawn, locale), dusk: formatClock(dusk, locale) })}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  compactText: {
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailedItem: {
    alignItems: 'center',
    gap: Spacing.half,
  },
});
