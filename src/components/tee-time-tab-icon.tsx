import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { useBookmarks } from '@/hooks/use-bookmarks';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

const BADGE_HEIGHT = 16;
const SLIDE_DISTANCE = BADGE_HEIGHT;
const SLIDE_DURATION = 220;
const FADE_DURATION = 160;
const MAX_COUNT = 99;

// The bundled SlideIn/SlideOut presets travel a full window height, which
// looks broken on a 16px badge, so the digit swap uses short custom slides.
function slideIn(from: number) {
  return new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateY: from }],
    },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }],
      easing: Easing.out(Easing.quad),
    },
  }).duration(SLIDE_DURATION);
}

function slideOut(to: number) {
  return new Keyframe({
    0: {
      opacity: 1,
      transform: [{ translateY: 0 }],
    },
    100: {
      opacity: 0,
      transform: [{ translateY: to }],
      easing: Easing.in(Easing.quad),
    },
  }).duration(SLIDE_DURATION);
}

const ENTER_FROM_BELOW = slideIn(SLIDE_DISTANCE);
const ENTER_FROM_ABOVE = slideIn(-SLIDE_DISTANCE);
const EXIT_UPWARDS = slideOut(-SLIDE_DISTANCE);
const EXIT_DOWNWARDS = slideOut(SLIDE_DISTANCE);

const BADGE_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.4 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.out(Easing.back(2)) },
}).duration(FADE_DURATION);

const BADGE_EXIT = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.4 }], easing: Easing.in(Easing.quad) },
}).duration(FADE_DURATION);

export function TeeTimeTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { bookmarks } = useBookmarks();
  const { t } = useI18n();
  const theme = useTheme();
  const count = bookmarks.length;
  // The slide direction has to be known on the render where the count changes,
  // so it is derived during render rather than in an effect.
  const [tracked, setTracked] = useState({ count, increased: true });
  const increased = tracked.count === count ? tracked.increased : count > tracked.count;

  if (tracked.count !== count) {
    setTracked({ count, increased });
  }

  const label = count > MAX_COUNT ? `${MAX_COUNT}+` : String(count);

  return (
    <View style={styles.container}>
      <SymbolView
        name={{
          ios: focused ? 'figure.golf.circle.fill' : 'figure.golf.circle',
          android: 'sports_golf',
          web: 'sports_golf',
        }}
        size={22}
        tintColor={color}
      />
      {count > 0 && (
        <Animated.View
          entering={BADGE_ENTER}
          exiting={BADGE_EXIT}
          style={[styles.badge, { backgroundColor: theme.textSecondary }]}
          accessibilityLabel={`${t('tabs.bookmarks')}: ${count}`}>
          {/* Sizes the pill to the current label; the visible digits sit on top
              so the outgoing and incoming values can overlap while sliding. */}
          <Text style={[styles.count, styles.spacer]}>{label}</Text>
          <Animated.Text
            key={label}
            entering={increased ? ENTER_FROM_BELOW : ENTER_FROM_ABOVE}
            exiting={increased ? EXIT_UPWARDS : EXIT_DOWNWARDS}
            style={[styles.count, styles.countOverlay, { color: theme.background }]}>
            {label}
          </Animated.Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: BADGE_HEIGHT,
    height: BADGE_HEIGHT,
    paddingHorizontal: 4,
    borderRadius: BADGE_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  count: {
    fontSize: 11,
    lineHeight: BADGE_HEIGHT,
    fontWeight: 700,
    textAlign: 'center',
  },
  spacer: {
    opacity: 0,
  },
  countOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
