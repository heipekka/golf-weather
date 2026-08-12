# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Overview

Nordic golf course weather app. Lists ~400 static golf courses (Finland, Denmark, Norway, Sweden, Spain, Estonia; the list screen filters them to a distance radius, 200 km by default), fetches forecasts from three weather sources, aggregates them, and scores playability per hour/window. Supports favorites, i18n (fi/en, Finnish default), and deploys as a static web export to Vercel. Almost no backend: all API calls happen client-side, except a one-route Vercel Edge Function ([api/yr.ts](api/yr.ts)) that proxies YR.no for the web build. No test suite.

## Tech stack

- Expo SDK 57 + Expo Router 57 (file-based routing, typed routes)
- React 19, React Native 0.86, react-native-web
- TypeScript 6 (strict), path aliases `@/*` -> `./src/*`, `@/assets/*` -> `./assets/*`
- `expo-symbols` for icons (SF Symbols / Material, per-platform name maps)
- `expo-location` for GPS, `@react-native-async-storage/async-storage` for persistence
- `suncalc` for sunrise/sunset (offline, no API)
- `fast-xml-parser` for parsing FMI's XML forecast responses
- ESLint 9 via `eslint-config-expo`
- Present in `package.json` but currently unused in `src/`: `@expo/ui`, `expo-glass-effect`, `expo-image`, `expo-web-browser`, `react-native-gesture-handler`, `react-native-worklets`

## Directory map

- `api/yr.ts` — Vercel Edge Function proxying YR.no for web only (CORS + `User-Agent`, edge-cached); native calls MET directly from `src/lib/weather/yr.ts`
- `src/app/` — Expo Router screens (see Routes below)
- `src/components/` — reusable UI (`CourseCard`, `HourlyStrip`, `PlayabilityBadge`, `SourceComparisonTable`, `ThemedText`/`ThemedView`, etc.)
- `src/hooks/` — custom hooks and context providers (`use-favorites`, `use-course-sort`, `use-location`, `use-courses-weather`, `use-course-weather`, `use-current-hour`, `use-theme`, `use-color-scheme` + `.web` variant)
- `src/lib/` — business logic:
  - `lib/weather/` — API clients + aggregation (core data layer): `fmi.ts`, `yr.ts`, `open-meteo.ts`, `aggregate.ts`, `types.ts`, `index.ts` (orchestration), `request.ts` (concurrency caps, retries, timeouts), `cache.ts` (per-source cache), `persist.ts` (bounded AsyncStorage cache)
  - `lib/golf.ts` — playability scoring/classification
  - `lib/course-sort.ts` — list ordering (location/weather/combined)
  - `lib/geo.ts` — `GolfCourse` type, haversine distance, `sortByDistance`
  - `lib/sun.ts` — sunrise/sunset via `suncalc`, night detection for icons
  - `lib/format.ts` — locale-aware formatting (temp, wind, precip, distance, time)
  - `lib/usage-log.ts` — anonymous session logging to AsyncStorage (settings screen)
- `src/data/` — `golf-courses.json` (static course list: id, name, city, lat, lon) + `golf-courses.ts` (typed import, `getCourseById`)
- `src/i18n/` — `index.tsx` (`LanguageProvider`, `useI18n()`, `t()`), `types.ts`, `translations/fi.ts`, `translations/en.ts`
- `src/constants/theme.ts` — colors, spacing, fonts, layout constants
- `assets/` — icons, splash, favicon
- `scripts/reset-project.js` — Expo template reset utility (not used in normal dev)
- `dist/` — static web build output (`expo export -p web`), generated, don't edit

## Routes

```
/                    -> redirect to /courses
/courses             -> course list (tab)
/course/[id]         -> course detail (hidden tab, keeps bottom nav visible)
/favorites           -> favorites list (tab)
/bookmarks           -> bookmarks list (tab)
/settings            -> settings (root stack)
```

Provider nesting in [src/app/_layout.tsx](src/app/_layout.tsx): `LanguageProvider` -> `FavoritesProvider` -> `SortModeProvider` -> `ThemeProvider`.

## Data flow

```
golf-courses.json
  -> useLocation()               (GPS, Kuopio fallback if denied)
  -> sortByDistance() + distance filter
  -> useCoursesWeather() / useCourseWeather()
  -> fetchCoursesWeather(points) / fetchAllSources(lat, lon)   [src/lib/weather/index.ts]
       -> cache.ts        per-source cache, in-flight dedupe, last-known-good
       -> request.ts      per-provider concurrency cap, retries, timeouts
            - fetchOpenMeteoBatch()  Open-Meteo, all courses in one request
            - fetchFmi()             FMI WFS XML (Harmonie), per course
            - fetchYr()              MET Norway Locationforecast, per course
     (errors isolated per source; a failed source falls back to its last value)
  -> aggregateForecasts()        hourly averages across available sources
  -> scorePlayability() / classifyHour()   [src/lib/golf.ts]
  -> UI (CourseCard, HourlyStrip, PlayabilityBadge, SourceComparisonTable)
```

Sun times come from `suncalc` locally, no network call.

## Conventions

- kebab-case filenames (`course-card.tsx`, `use-course-weather.ts`)
- Hooks named `use-*.ts(x)`; context providers are exported from the same hook file
- Platform-specific overrides use `.web.ts`/`.web.tsx` (e.g. `use-color-scheme.web.ts`, `animated-icon.web.tsx`)
- Always import via the `@/` alias, never relative `../../`
- Use `import type` for type-only imports
- Styling is plain React Native `StyleSheet` (no NativeWind/Tamagui); theme via `useTheme()` -> `Colors` in `src/constants/theme.ts`; spacing via the `Spacing` scale
- Global state is React Context only (language, favorites, sort mode) + AsyncStorage, keys prefixed `golf-weather.*`; no Redux/Zustand
- Weather state is local to hooks, not global. Caching lives in [src/lib/weather/cache.ts](src/lib/weather/cache.ts): keyed per course *and* per source (so one failing provider is retried on its own), 15 min TTL, only successful fetches are stored, and a bounded compact copy is persisted to AsyncStorage under `golf-weather.forecastCache.v1`

## Common task pointers

- Add/edit golf courses -> [src/data/golf-courses.json](src/data/golf-courses.json)
- Change weather fetching/aggregation -> [src/lib/weather/](src/lib/weather) (API reference + sample responses: [docs/weather-api-reference.md](docs/weather-api-reference.md))
- Change playability thresholds/labels -> [src/lib/golf.ts](src/lib/golf.ts)
- Add/edit UI strings -> update **both** [src/i18n/translations/fi.ts](src/i18n/translations/fi.ts) and [src/i18n/translations/en.ts](src/i18n/translations/en.ts)

## Commands

- `npm run start` / `npm run ios` / `npm run android` / `npm run web` — dev server
- `npm run lint` — ESLint; run before committing (no test suite exists)
- `expo export -p web` — production web build to `dist/` (used by Vercel via [vercel.json](vercel.json))

## Gotchas

- YR.no requires a `User-Agent` header or requests are rejected with 403, and doesn't grant CORS to arbitrary origins. Browsers strip custom `User-Agent` headers, so web can't call MET directly; native can and does. Web instead calls the same-origin proxy `api/yr.ts` ([Platform.OS](https://reactnative.dev/docs/platform) branch in `src/lib/weather/yr.ts`), which sets the header server-side and lets Vercel edge-cache successful responses for 15 min (`Vercel-CDN-Cache-Control`) — don't forward MET's own `Cache-Control` verbatim, or the edge cache won't apply
- FMI responses are XML, parsed with `fast-xml-parser`. Harmonie only covers the Nordic/Baltic area, so the Spanish courses get no FMI data
- Open-Meteo rejects bursts above roughly 9 concurrent requests per IP with `429 {"reason":"Too many concurrent requests"}`, separately from its 10k/day quota. Hence the batched multi-coordinate request and the concurrency caps in [src/lib/weather/request.ts](src/lib/weather/request.ts) — don't reintroduce per-course Open-Meteo fetching
- Open-Meteo returns an array for several coordinates but a bare object for one, and echoes coordinates snapped to the model grid, so batch results must be matched to courses by index, never by coordinate
- List weather fetch batches state updates ~every 1s; concurrency is enforced in the lib, not the hook, so extra mounted screens can't stack requests
- Hour rollover happens at :45 past the hour (`useCurrentHour`), triggering a forced refresh, spread over a short jitter window since every mounted screen reacts at once
- Web hydration: some values (e.g. sun times) render as empty defaults until client-side hydration completes
- Some template leftovers are unused and safe to ignore/remove: `src/components/web-badge.tsx`, `hint-row.tsx`, `external-link.tsx`, `src/components/ui/collapsible.tsx`
