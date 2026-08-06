import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useIsGlassPalette } from '@/hooks/use-glass-surface';
import { useI18n } from '@/i18n';
import { glassBadgeBackground, PlayabilityColors, type Playability, type PlayabilityLabel } from '@/lib/golf';

export function PlayabilityBadge({ playability }: { playability: Playability }) {
  const { t } = useI18n();
  const isGlass = useIsGlassPalette();
  const trend = playability.trend;

  if (trend) {
    const earlyLabel = t(`playability.labels.${trend.early}`);
    const lateLabel = t(`playability.labels.${trend.late}`);

    return (
      <View
        style={styles.badgeSplit}
        accessibilityLabel={t('playability.trend', { early: earlyLabel, late: lateLabel })}
      >
        <BadgeHalf label={trend.early} text={earlyLabel} style={styles.halfLeft} isGlass={isGlass} />
        <BadgeHalf label={trend.late} text={lateLabel} style={styles.halfRight} isGlass={isGlass} />
      </View>
    );
  }

  const color = PlayabilityColors[playability.label];
  return (
    <View style={[styles.badge, { backgroundColor: badgeBackground(color, isGlass) }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {t(`playability.labels.${playability.label}`)}
      </ThemedText>
    </View>
  );
}

function BadgeHalf({
  label,
  text,
  style,
  isGlass,
}: {
  label: PlayabilityLabel;
  text: string;
  style: object;
  isGlass: boolean;
}) {
  const color = PlayabilityColors[label];

  return (
    <View style={[styles.half, style, { backgroundColor: badgeBackground(color, isGlass) }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {text}
      </ThemedText>
    </View>
  );
}

function badgeBackground(hex: string, isGlass: boolean): string {
  return isGlass ? glassBadgeBackground(hex) : `${hex}40`;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.five,
  },
  badgeSplit: {
    flexDirection: 'row',
    borderRadius: Spacing.five,
    overflow: 'hidden',
  },
  half: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  halfLeft: {
    borderTopLeftRadius: Spacing.five,
    borderBottomLeftRadius: Spacing.five,
  },
  halfRight: {
    borderTopRightRadius: Spacing.five,
    borderBottomRightRadius: Spacing.five,
    marginLeft: 1,
  },
});
