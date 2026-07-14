import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";

import { useTheme } from "@/hooks/use-theme";

type Condition =
  | "clear"
  | "partlyCloudy"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "thunder"
  | "unknown";

type IconVariant = {
  ios: SFSymbol;
  material: AndroidSymbol;
  iosNight?: SFSymbol;
  materialNight?: AndroidSymbol;
};

const ICONS: Record<Condition, IconVariant> = {
  clear: {
    ios: "sun.max.fill",
    material: "sunny",
    iosNight: "moon.stars.fill",
    materialNight: "bedtime",
  },
  partlyCloudy: {
    ios: "cloud.sun.fill",
    material: "partly_cloudy_day",
    iosNight: "cloud.moon.fill",
    materialNight: "partly_cloudy_night",
  },
  cloudy: { ios: "cloud.fill", material: "cloud" },
  fog: { ios: "cloud.fog.fill", material: "foggy" },
  rain: { ios: "cloud.rain.fill", material: "rainy" },
  snow: { ios: "cloud.snow.fill", material: "ac_unit" },
  thunder: { ios: "cloud.bolt.rain.fill", material: "thunderstorm" },
  unknown: { ios: "questionmark.circle", material: "help" },
};

// Open-Meteo uses WMO weather codes: https://open-meteo.com/en/docs
const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82,
]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const THUNDER_CODES = new Set([95, 96, 99]);
const FOG_CODES = new Set([45, 48]);

export type WeatherConditionInput = {
  weatherCode?: number | null;
  precipitation?: number | null;
  cloudCover?: number | null;
};

export function resolveCondition({
  weatherCode,
  precipitation,
  cloudCover,
}: WeatherConditionInput): Condition {
  if (weatherCode !== null && weatherCode !== undefined) {
    if (THUNDER_CODES.has(weatherCode)) return "thunder";
    if (SNOW_CODES.has(weatherCode)) return "snow";
    if (RAIN_CODES.has(weatherCode)) return "rain";
    if (FOG_CODES.has(weatherCode)) return "fog";
    if (weatherCode === 0) return "clear";
    if (weatherCode === 1 || weatherCode === 2) return "partlyCloudy";
    if (weatherCode === 3) return "cloudy";
  }

  if (
    precipitation !== null &&
    precipitation !== undefined &&
    precipitation > 0.2
  ) {
    return "rain";
  }

  if (cloudCover !== null && cloudCover !== undefined) {
    if (cloudCover > 90) return "cloudy";
    if (cloudCover > 30) return "partlyCloudy";
    return "clear";
  }

  return "unknown";
}

export type WeatherIconProps = WeatherConditionInput & {
  size?: number;
  tintColor?: string;
  /** When true, uses the night variant of the icon (e.g. moon instead of sun) if one exists. */
  isNight?: boolean;
};

export function WeatherIcon({
  weatherCode,
  precipitation,
  cloudCover,
  size = 28,
  tintColor,
  isNight = false,
}: WeatherIconProps) {
  const theme = useTheme();
  const condition = resolveCondition({ weatherCode, precipitation, cloudCover });
  if (condition === "unknown") return null;
  const icon = ICONS[condition];
  const ios = isNight && icon.iosNight ? icon.iosNight : icon.ios;
  const material =
    isNight && icon.materialNight ? icon.materialNight : icon.material;

  return (
    <SymbolView
      name={{ ios, android: material, web: material }}
      size={size}
      tintColor={tintColor ?? theme.text}
    />
  );
}
