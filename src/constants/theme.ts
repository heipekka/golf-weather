/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    backgroundSolid: "#ffffff",
    accent: "#000000",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    backgroundSolid: "#000000",
    accent: "#ffffff",
  },
  /**
   * Frosted-glass alternative: a photo background shows through `background`
   * (transparent) while cards float above it as translucent white surfaces.
   * `backgroundSolid`/`accent` give components an opaque color to use when
   * they need a foreground (e.g. text drawn on top of an inverted button),
   * since `background` itself can no longer serve double duty as one.
   */
  glass: {
    text: "#ffffff",
    background: "transparent",
    backgroundElement: "rgba(255, 255, 255, 0.16)",
    backgroundSelected: "rgba(255, 255, 255, 0.28)",
    textSecondary: "rgba(255, 255, 255, 0.78)",
    backgroundSolid: "#0f1f18",
    accent: "#3ddc84",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark & keyof typeof Colors.glass;

/**
 * Hairline border and web-only blur applied to `glass` palette surfaces so
 * translucent cards read as frosted glass over the background photo.
 * `backdropFilter` isn't in React Native's `ViewStyle` type (it's a
 * react-native-web-only property), so consumers must cast when spreading it.
 * See `useGlassSurfaceStyle`/`useGlassBackdropStyle` in
 * `@/hooks/use-glass-surface` for the ready-to-spread style objects.
 */
export const GlassSurface = {
  borderColor: "rgba(255, 255, 255, 0.35)",
  borderWidth: 1,
  webBackdropFilter: "blur(18px) saturate(140%)",
  // Tinted with `glass.backgroundSolid` rather than pure black so modal
  // scrims read as a darker pane of the same glass, not a generic overlay.
  // Kept fairly opaque since native has no blur to lean on, and a
  // translucent white panel over a lighter scrim leaves the content behind
  // it too readable.
  backdropColor: "rgba(6, 18, 13, 0.72)",
  webBackdropBlur: "blur(10px)",
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
