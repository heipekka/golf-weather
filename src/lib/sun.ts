import { getPosition, getTimes } from 'suncalc';

export type SunTimes = {
  sunrise: Date | null;
  sunset: Date | null;
  /** Civil twilight begin — earliest usable light before sunrise. */
  dawn: Date | null;
  /** Civil twilight end — latest usable light after sunset. */
  dusk: Date | null;
  /** Minutes between sunrise and sunset, or null if there is no true sunrise/sunset. */
  daylightMinutes: number | null;
};

function toDateOrNull(value: Date | undefined): Date | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value;
}

/**
 * Placeholder used before client-side hydration on web, where the static
 * export's build-time HTML would otherwise disagree with the hydrating
 * browser's timezone/date and trigger a hydration mismatch.
 */
export const EMPTY_SUN_TIMES: SunTimes = {
  sunrise: null,
  sunset: null,
  dawn: null,
  dusk: null,
  daylightMinutes: null,
};

/**
 * Computes sunrise/sunset and civil twilight bounds for a location, entirely
 * offline. Near midsummer/midwinter in Finland, SunCalc can return an
 * `Invalid Date` for fields that don't occur that day (e.g. no sunset during
 * the midnight sun) — those come back as `null` here so callers can show a
 * fallback like "Midnight sun" instead of a broken time.
 */
export function getSunTimes(lat: number, lon: number, date: Date = new Date()): SunTimes {
  const times = getTimes(date, lat, lon);

  const sunrise = toDateOrNull(times.sunrise);
  const sunset = toDateOrNull(times.sunset);

  return {
    sunrise,
    sunset,
    dawn: toDateOrNull(times.dawn),
    dusk: toDateOrNull(times.dusk),
    daylightMinutes:
      sunrise && sunset ? Math.round((sunset.getTime() - sunrise.getTime()) / 60000) : null,
  };
}

/**
 * Sun altitude (degrees) below which an hour is treated as "night" for icon
 * purposes. -6 is civil twilight (roughly when it starts getting dark and
 * artificial light is needed). Lower = must be darker before showing a moon.
 *
 * A plain horizon cutoff (0) is too eager at high latitudes in summer, e.g.
 * Kuopio's "white nights" where the sun dips only a few degrees below the
 * horizon but it never really gets dark.
 */
export const NIGHT_ALTITUDE_DEG = -6;

/** True when the sun is below the twilight threshold at the given time/location (night). */
export function isNight(time: string | Date, lat: number, lon: number): boolean {
  const date = typeof time === 'string' ? new Date(time) : time;
  return getPosition(date, lat, lon).altitude < NIGHT_ALTITUDE_DEG;
}
