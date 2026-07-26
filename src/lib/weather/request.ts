import type { SourceId } from './types';

/**
 * Maximum simultaneous in-flight requests per provider, enforced process-wide
 * rather than per screen. Open-Meteo rejects bursts above roughly nine
 * concurrent requests per IP with `429 {"reason":"Too many concurrent
 * requests"}` — independent of its daily quota — so its ceiling is kept well
 * clear of that even when several screens refresh at the same moment. FMI and
 * MET Norway tolerate far more (MET documents 20 requests/second).
 */
const MAX_CONCURRENT: Record<SourceId, number> = {
  openmeteo: 4,
  fmi: 6,
  yr: 6,
};

/** Total tries per request, i.e. one initial attempt plus two retries. */
const MAX_ATTEMPTS = 3;

/** Bounds a single attempt, so one stuck socket can't consume the whole budget. */
const ATTEMPT_TIMEOUT_MS = 10_000;

/** Bounds all attempts plus their backoff, so a caller can't wait indefinitely. */
const OVERALL_DEADLINE_MS = 25_000;

const BASE_BACKOFF_MS = 400;

/** Fraction of the backoff delay randomized, to avoid retry convoys. */
const BACKOFF_JITTER = 0.3;

/**
 * Statuses worth retrying: rate limiting and transient upstream failures.
 * Everything else (bad parameters, a rejected User-Agent, unknown stored
 * query) would fail identically on a retry.
 */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export class WeatherRequestError extends Error {
  readonly status?: number;
  readonly timedOut: boolean;

  constructor(message: string, options?: { status?: number; timedOut?: boolean }) {
    super(message);
    this.name = 'WeatherRequestError';
    this.status = options?.status;
    this.timedOut = options?.timedOut ?? false;
  }
}

/** Reports whether a thrown value represents a request that ran out of time. */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof WeatherRequestError && error.timedOut;
}

type Release = () => void;

/**
 * Counting semaphore granting at most `limit` concurrent holders, with
 * waiters served in arrival order.
 */
class Semaphore {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  acquire(): Promise<Release> {
    return new Promise<Release>((resolve) => {
      const grant = () => {
        this.active += 1;
        let released = false;
        resolve(() => {
          if (released) return;
          released = true;
          this.active -= 1;
          this.waiting.shift()?.();
        });
      };

      if (this.active < this.limit) {
        grant();
      } else {
        this.waiting.push(grant);
      }
    });
  }
}

const semaphores: Record<SourceId, Semaphore> = {
  openmeteo: new Semaphore(MAX_CONCURRENT.openmeteo),
  fmi: new Semaphore(MAX_CONCURRENT.fmi),
  yr: new Semaphore(MAX_CONCURRENT.yr),
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(finish, ms);
    function finish() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', finish);
      resolve();
    }
    signal?.addEventListener('abort', finish);
  });
}

function jittered(delayMs: number): number {
  const spread = delayMs * BACKOFF_JITTER;
  return Math.max(0, delayMs - spread + Math.random() * spread * 2);
}

/**
 * Reads a `Retry-After` header, which may be either a delay in seconds or an
 * HTTP date. Returns `null` when absent or unparseable.
 */
function retryAfterMs(response: Response): number | null {
  const header = response.headers?.get?.('Retry-After');
  if (!header) return null;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());

  return null;
}

/**
 * Performs a single attempt under a timeout, also honoring the caller's
 * signal. Resolves with the body text so the concurrency slot stays held
 * until the response has been fully read, rather than being released while
 * bytes are still arriving.
 */
async function attempt(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined
): Promise<{ ok: true; body: string } | { ok: false; response: Response }> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromCaller = () => controller.abort();
  callerSignal?.addEventListener('abort', abortFromCaller);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return { ok: false, response };
    return { ok: true, body: await response.text() };
  } catch (error) {
    if (timedOut) {
      throw new WeatherRequestError(`Request timed out after ${timeoutMs} ms`, { timedOut: true });
    }
    throw error;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}

/**
 * Fetches `url` under this app's shared request policy: a per-provider
 * concurrency cap, a per-attempt timeout, an overall deadline, and retries
 * with jittered exponential backoff for rate limiting and transient upstream
 * failures. Resolves with the response body as text (callers parse it), since
 * the concurrency slot is held across the body read.
 *
 * The concurrency slot is released during backoff, so a rate-limited request
 * waiting to retry doesn't block other courses from progressing.
 */
export async function fetchWithPolicy(
  url: string,
  init: RequestInit | undefined,
  options: { source: SourceId; signal?: AbortSignal }
): Promise<string> {
  const deadline = Date.now() + OVERALL_DEADLINE_MS;
  const semaphore = semaphores[options.source];
  let lastError: unknown;

  for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
    if (options.signal?.aborted) break;

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      lastError =
        lastError ?? new WeatherRequestError('Request exceeded its deadline', { timedOut: true });
      break;
    }

    const release = await semaphore.acquire();
    let retryDelayMs: number | null = null;
    try {
      const result = await attempt(
        url,
        init,
        Math.min(ATTEMPT_TIMEOUT_MS, remaining),
        options.signal
      );

      if (result.ok) return result.body;

      const { status } = result.response;
      const httpError = new WeatherRequestError(`Request failed with status ${status}`, { status });
      if (!RETRYABLE_STATUSES.has(status)) throw httpError;
      lastError = httpError;
      retryDelayMs = retryAfterMs(result.response);
    } catch (error) {
      // A rejected status is only thrown here when retrying it would be
      // pointless, so it propagates; network and timeout failures fall through
      // to another attempt.
      if (error instanceof WeatherRequestError && error.status !== undefined) throw error;
      if (options.signal?.aborted) throw error;
      lastError = error;
    } finally {
      release();
    }

    const isLastAttempt = index === MAX_ATTEMPTS - 1;
    if (isLastAttempt) break;

    const backoff = retryDelayMs ?? jittered(BASE_BACKOFF_MS * 2 ** index);
    const budget = deadline - Date.now();
    if (backoff >= budget) break;
    await sleep(backoff, options.signal);
  }

  throw lastError ?? new WeatherRequestError('Request failed');
}
