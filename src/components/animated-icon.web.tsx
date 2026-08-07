import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';
import { useHasHydrated } from '@/hooks/use-color-scheme';

const DURATION = 400;
// Matches `#boot-splash` in `+html.tsx`, which paints the same photo + scrim
// before React has even loaded so there's no white flash on first load.
const BOOT_SPLASH_ID = 'boot-splash';

const BACKGROUND_SOURCE = require('@/assets/images/backgrounds/course-illustration.jpg');

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (!hasHydrated) return;
    document.getElementById(BOOT_SPLASH_ID)?.remove();
    // Deferred a tick so this doesn't set state synchronously within the
    // effect body (which can trigger cascading renders).
    Promise.resolve().then(() => setAnimate(true));
  }, [hasHydrated]);

  if (!visible) return null;

  const fadeOutKeyframe = new Keyframe({
    0: {
      opacity: 1,
    },
    100: {
      opacity: 0,
      easing: Easing.out(Easing.ease),
    },
  });

  const content = (
    <>
      <Image style={StyleSheet.absoluteFill} source={BACKGROUND_SOURCE} contentFit="cover" />
      <View style={styles.scrim} />
    </>
  );

  return animate ? (
    <Animated.View
      entering={fadeOutKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.overlay}
      pointerEvents="none">
      {content}
    </Animated.View>
  ) : (
    <View style={styles.overlay}>{content}</View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.glass.backgroundSolid,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
