import { Platform, View, type ViewProps, type ViewStyle } from "react-native";

import { GlassSurface, ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useResolvedPalette } from "@/hooks/use-theme-mode";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

// Card-like surfaces that should read as frosted glass over the background
// photo when the glass palette is active.
const GLASS_SURFACE_TYPES: ThemeColor[] = ["backgroundElement", "backgroundSelected"];

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();
  const palette = useResolvedPalette();

  const isGlassSurface =
    palette === "glass" && GLASS_SURFACE_TYPES.includes(type ?? "background");

  return (
    <View
      style={[
        { backgroundColor: theme[type ?? "background"] },
        isGlassSurface && {
          borderColor: GlassSurface.borderColor,
          borderWidth: GlassSurface.borderWidth,
          // `backdropFilter` is a react-native-web-only style property, not
          // part of React Native's ViewStyle, hence the cast; it's a no-op
          // (ignored) on native, which is fine since native has no blur here.
          ...(Platform.OS === "web"
            ? ({ backdropFilter: GlassSurface.webBackdropFilter } as ViewStyle)
            : null),
        },
        style,
      ]}
      {...otherProps}
    />
  );
}
