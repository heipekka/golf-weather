import type { Locale } from '@/i18n';

export function formatTemperature(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--°';
  return `${Math.round(value)}°`;
}

export function formatWind(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-- m/s';
  return `${value.toFixed(1)} m/s`;
}

export function formatPrecipitation(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-- mm';
  return `${value.toFixed(1)} mm`;
}

function finiteNumbers(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));
}

/** Averages a window of temperature readings into a single formatted value. */
export function formatTemperatureAverage(values: (number | null | undefined)[]): string {
  const nums = finiteNumbers(values);
  if (nums.length === 0) return formatTemperature(null);
  return formatTemperature(nums.reduce((sum, v) => sum + v, 0) / nums.length);
}

/** Averages a window of wind readings, or shows a min-max range if the spread exceeds 0.5 m/s. */
export function formatWindRange(values: (number | null | undefined)[]): string {
  const nums = finiteNumbers(values);
  if (nums.length === 0) return formatWind(null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max - min > 0.5) return `${min.toFixed(1)}-${max.toFixed(1)} m/s`;
  return formatWind(nums.reduce((sum, v) => sum + v, 0) / nums.length);
}

/** Shows a single precipitation value, or a min-max range if it changes across the window. */
export function formatPrecipitationRange(values: (number | null | undefined)[]): string {
  const nums = finiteNumbers(values);
  if (nums.length === 0) return formatPrecipitation(null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min.toFixed(1) !== max.toFixed(1)) return `${min.toFixed(1)}-${max.toFixed(1)} mm`;
  return formatPrecipitation(min);
}

export function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Formats coordinates as a compact "lat, lon" string, ~100m precision. */
export function formatCoordinates(coords: { lat: number; lon: number }): string {
  return `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`;
}

export function formatHour(iso: string, locale: Locale = 'fi-FI'): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Formats an ISO timestamp as a locale-numeric date, e.g. "12.7.2026". */
export function formatDate(iso: string, locale: Locale = 'fi-FI'): string {
  return new Date(iso).toLocaleDateString(locale);
}

/** Just the hour, e.g. "14", for compact strips/columns. */
export function formatHourShort(iso: string, locale: Locale = 'fi-FI'): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit' }).replace(/\D/g, '');
}

export function formatDayLabel(iso: string, locale: Locale = 'fi-FI'): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Formats a Date as "HH:mm" in local time, e.g. for sunrise/sunset. */
export function formatClock(date: Date | null | undefined, locale: Locale = 'fi-FI'): string {
  if (!date || Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Formats an ISO timestamp as a localized date + time, e.g. for usage log entries. */
export function formatDateTime(iso: string | null | undefined, locale: Locale = 'fi-FI'): string {
  if (!iso) return '--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Formats a duration in minutes as "Hh Mmin", e.g. "18h 32min". */
export function formatDuration(
  minutes: number | null | undefined,
  units: { hour: string; minute: string } = { hour: 'h', minute: 'min' }
): string {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}${units.hour} ${mins}${units.minute}`;
}
