// Vercel Edge Function proxying MET Norway's Locationforecast API for the web
// build. Browsers can't reliably call api.met.no directly: MET doesn't grant
// CORS to arbitrary origins, and the identifying User-Agent it requires is a
// forbidden header that browsers strip. This runs server-side, where both
// restrictions don't apply. Native builds skip this and call MET directly
// (see src/lib/weather/yr.ts).
export const config = { runtime: 'edge' };

const MET_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
// Per https://api.met.no/doc/TermsOfService: a descriptive User-Agent
// identifying the app, or requests are rejected with 403.
const USER_AGENT = 'golf-weather-app/1.0 github.com/heipekka/golf-weather';

// Informational metadata forwarded as-is; cache headers are set below instead
// of forwarded, so the edge cache TTL is controlled here rather than by MET.
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'expires', 'last-modified'];

// Matches TTL_MS in src/lib/weather/cache.ts, so the edge and the client's own
// cache expire together.
const CACHE_TTL_SECONDS = 15 * 60;
const STALE_WHILE_REVALIDATE_SECONDS = 60 * 60;
const STALE_IF_ERROR_SECONDS = 24 * 60 * 60;

function isValidLat(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLon(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export default async function handler(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));

  if (!isValidLat(lat) || !isValidLon(lon)) {
    return Response.json({ error: 'Invalid lat/lon' }, { status: 400 });
  }

  const upstreamUrl = `${MET_URL}?lat=${lat}&lon=${lon}`;
  const upstream = await fetch(upstreamUrl, { headers: { 'User-Agent': USER_AGENT } });
  // Buffered rather than streamed so the cache headers below can depend on
  // the upstream status.
  const body = await upstream.text();

  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (upstream.ok) {
    // The browser defers to the app's own 15 min cache (cache.ts), so only
    // the edge cache matters here. Vercel-CDN-Cache-Control outranks
    // Cache-Control on Vercel, keeping the two TTLs independent; every
    // course shares this cache entry across all visitors, since lat/lon are
    // static per course and the URL is the cache key.
    headers.set('cache-control', 'public, max-age=0, must-revalidate');
    headers.set(
      'vercel-cdn-cache-control',
      `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}, stale-if-error=${STALE_IF_ERROR_SECONDS}`
    );
  } else {
    // Never cache failures: a cached 403/429 would be served to every
    // visitor and starve the retry logic in src/lib/weather/request.ts.
    headers.set('cache-control', 'no-store');
  }

  return new Response(body, { status: upstream.status, headers });
}
