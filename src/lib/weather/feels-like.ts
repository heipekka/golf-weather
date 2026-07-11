/**
 * Wind-chill threshold below which "feels colder than the thermometer"
 * applies; above this the still-air temperature is what it feels like
 * (no humidity data is fetched, so no warm-weather heat index is applied).
 */
const WIND_CHILL_MAX_TEMPERATURE_C = 10;

/** Minimum wind speed (km/h) for wind chill to have a noticeable effect. */
const WIND_CHILL_MIN_SPEED_KMH = 4.8;

/**
 * Computes an apparent ("feels like") temperature for providers that don't
 * return one natively (FMI, YR), using the standard metric wind-chill
 * formula (Environment Canada / JAG-TI), which only lowers the perceived
 * temperature in cold, windy conditions. Falls back to the raw temperature
 * outside that range, and to `null` when temperature is unknown.
 */
export function computeApparentTemperature(
  temperature: number | null,
  windSpeedMs: number | null
): number | null {
  if (temperature === null || !Number.isFinite(temperature)) return null;

  const windSpeedKmh = windSpeedMs !== null && Number.isFinite(windSpeedMs) ? windSpeedMs * 3.6 : 0;

  if (temperature > WIND_CHILL_MAX_TEMPERATURE_C || windSpeedKmh <= WIND_CHILL_MIN_SPEED_KMH) {
    return temperature;
  }

  const v16 = Math.pow(windSpeedKmh, 0.16);
  return 13.12 + 0.6215 * temperature - 11.37 * v16 + 0.3965 * temperature * v16;
}
