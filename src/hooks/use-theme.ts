/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useResolvedPalette } from "@/hooks/use-theme-mode";

export function useTheme() {
  const palette = useResolvedPalette();

  return Colors[palette];
}
