const USAGE_PASSWORD = 'OmatLatausTilastot';
const UNLOCK_KEY = 'golf-weather.usage-unlocked';

/** Verifies the usage page password. Async to model a real API call, even though this is fully client-side. */
export async function verifyUsagePassword(input: string): Promise<boolean> {
  await Promise.resolve();
  return input === USAGE_PASSWORD;
}

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
}

export function isUsageUnlocked(): boolean {
  return getSessionStorage()?.getItem(UNLOCK_KEY) === 'true';
}

export function setUsageUnlocked(value: boolean): void {
  const storage = getSessionStorage();
  if (!storage) return;

  if (value) {
    storage.setItem(UNLOCK_KEY, 'true');
  } else {
    storage.removeItem(UNLOCK_KEY);
  }
}
