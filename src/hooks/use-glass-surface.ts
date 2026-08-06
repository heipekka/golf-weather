import { Platform, type ViewStyle } from "react-native";

import { GlassSurface } from "@/constants/theme";
import { useResolvedPalette } from "@/hooks/use-theme-mode";

/**
 * Extra border + (web-only) blur to layer onto a translucent glass-palette
 * surface (cards, pills, chips) so it reads as frosted glass over the
 * background photo. Returns `null` outside the glass theme, so callers can
 * spread it straight into a style array with `isGlass && glassSurfaceStyle`.
 */
export function useGlassSurfaceStyle(): ViewStyle | null {
  const palette = useResolvedPalette();
  if (palette !== "glass") return null;

  return {
    borderColor: GlassSurface.borderColor,
    borderWidth: GlassSurface.borderWidth,
    // `backdropFilter` is a react-native-web-only style property, not part
    // of React Native's ViewStyle, hence the cast; it's simply absent on
    // native, which is fine since native has no blur here.
    ...(Platform.OS === "web"
      ? ({ backdropFilter: GlassSurface.webBackdropFilter } as ViewStyle)
      : null),
  };
}

/**
 * Darker, blurred variant for full-screen modal backdrops/scrims: a tinted
 * glass pane over whatever is behind the dialog, instead of a plain black
 * scrim. Returns `null` outside the glass theme.
 */
export function useGlassBackdropStyle(): ViewStyle | null {
  const palette = useResolvedPalette();
  if (palette !== "glass") return null;

  return {
    backgroundColor: GlassSurface.backdropColor,
    ...(Platform.OS === "web"
      ? ({ backdropFilter: GlassSurface.webBackdropBlur } as ViewStyle)
      : null),
  };
}

/** Whether the glass palette is currently active. */
export function useIsGlassPalette(): boolean {
  return useResolvedPalette() === "glass";
}
