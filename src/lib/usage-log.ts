import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Dimensions, Platform } from 'react-native';

const USER_ID_KEY = 'golf-weather.userId';
const LOG_KEY = 'golf-weather.usage-log';
const MAX_SESSIONS = 500;

export type UsageSession = {
  /** ISO timestamp of the launch that produced this session. */
  at: string;
  /** Persistent anonymous id for this device at the time of the session. */
  userId: string;
  /** Hash of stable device/context fields, used to spot a different user on the same device. */
  fingerprint: string;
  platform: string;
  osVersion?: string;
  model?: string;
  appVersion?: string;
  locale?: string;
  timezone?: string;
  screen?: string;
};

export type UsageLog = {
  userId: string;
  sessions: UsageSession[];
};

export type UsageSummary = {
  totalSessions: number;
  distinctUsers: number;
  distinctFingerprints: number;
  firstSeen?: string;
  lastSeen?: string;
  recent: UsageSession[];
};

function generateId(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID();

  // Not cryptographically secure, but sufficient for an anonymous local usage id.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Short, non-reversible hash of stable device/context fields. */
function hashFingerprint(parts: (string | undefined)[]): string {
  const input = parts.filter(Boolean).join('|');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function isUsageSession(value: unknown): value is UsageSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.at === 'string' &&
    typeof session.userId === 'string' &&
    typeof session.fingerprint === 'string' &&
    typeof session.platform === 'string'
  );
}

function isUsageLog(value: unknown): value is UsageLog {
  if (!value || typeof value !== 'object') return false;
  const log = value as Record<string, unknown>;
  return typeof log.userId === 'string' && Array.isArray(log.sessions) && log.sessions.every(isUsageSession);
}

export async function getOrCreateUserId(): Promise<string> {
  const stored = await AsyncStorage.getItem(USER_ID_KEY).catch(() => null);
  if (stored) return stored;

  const id = generateId();
  await AsyncStorage.setItem(USER_ID_KEY, id).catch(() => {});
  return id;
}

function collectContext(): Omit<UsageSession, 'at' | 'userId'> {
  const { width, height, scale } = Dimensions.get('window');
  const [locale] = Localization.getLocales();
  const [calendar] = Localization.getCalendars();

  const platform = Platform.OS;
  const osVersion = Device.osVersion ?? undefined;
  const model = Device.modelName ?? undefined;
  const appVersion = Constants.expoConfig?.version;
  const localeTag = locale?.languageTag;
  const timezone = calendar?.timeZone ?? undefined;
  const screen = `${Math.round(width)}x${Math.round(height)}@${scale}`;

  return {
    fingerprint: hashFingerprint([platform, osVersion, model, localeTag, timezone, screen]),
    platform,
    osVersion,
    model,
    appVersion,
    locale: localeTag,
    timezone,
    screen,
  };
}

export async function readUsageLog(): Promise<UsageLog> {
  const userId = await getOrCreateUserId();
  const stored = await AsyncStorage.getItem(LOG_KEY).catch(() => null);
  if (!stored) return { userId, sessions: [] };

  try {
    const parsed = JSON.parse(stored);
    if (isUsageLog(parsed)) return parsed;
  } catch {
    // Fall through to an empty log below.
  }
  return { userId, sessions: [] };
}

let hasRecordedThisRuntime = false;

/** Appends one usage session for the current launch. Safe to call more than once per runtime. */
export async function recordSession(): Promise<void> {
  if (hasRecordedThisRuntime) return;
  hasRecordedThisRuntime = true;

  try {
    const log = await readUsageLog();
    const session: UsageSession = {
      at: new Date().toISOString(),
      userId: log.userId,
      ...collectContext(),
    };
    const sessions = [...log.sessions, session].slice(-MAX_SESSIONS);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify({ userId: log.userId, sessions }));
  } catch {
    // Usage tracking must never break the app.
  }
}

export function summarizeUsage(log: UsageLog, recentCount = 20): UsageSummary {
  const sorted = [...log.sessions].sort((a, b) => a.at.localeCompare(b.at));

  return {
    totalSessions: log.sessions.length,
    distinctUsers: new Set(log.sessions.map((session) => session.userId)).size,
    distinctFingerprints: new Set(log.sessions.map((session) => session.fingerprint)).size,
    firstSeen: sorted[0]?.at,
    lastSeen: sorted[sorted.length - 1]?.at,
    recent: sorted.slice(-recentCount).reverse(),
  };
}

export async function clearUsageLog(): Promise<void> {
  await AsyncStorage.removeItem(LOG_KEY).catch(() => {});
}
