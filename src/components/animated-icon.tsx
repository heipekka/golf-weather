import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useHasHydrated } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const DURATION = 500;

// Same photo + scrim as `AppBackdrop` in `_layout.tsx`, so the overlay fades
// away into an already-matching background instead of revealing a swap.
const BACKGROUND_SOURCE = require('@/assets/images/backgrounds/course-illustration.jpg');

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const [layoutReady, setLayoutReady] = useState(false);
  // On web, static markup is pre-rendered in light mode before hydration.
  // Hold the splash until hydration completes so the app's real (dark)
  // theme is already applied by the time the splash fades, instead of
  // briefly flashing the light theme underneath.
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (layoutReady && hasHydrated) {
      SplashScreen.hideAsync().finally(() => {
        setAnimate(true);
      });
    }
  }, [layoutReady, hasHydrated]);

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
    <View onLayout={() => setLayoutReady(true)} style={styles.overlay}>
      {content}
    </View>
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
