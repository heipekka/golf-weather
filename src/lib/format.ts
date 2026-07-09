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

export function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatHour(iso: string, locale: Locale = 'fi-FI'): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
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
