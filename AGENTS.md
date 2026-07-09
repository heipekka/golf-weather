# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Overview

Finnish golf course weather app. Lists ~99 static golf courses, fetches forecasts from three weather sources, aggregates them, and scores playability per hour/window. Supports favorites, i18n (fi/en, Finnish default), and deploys as a static web export to Vercel. No backend (all API calls happen client-side), no test suite.

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

- `src/app/` — Expo Router screens (see Routes below)
- `src/components/` — reusable UI (`CourseCard`, `HourlyStrip`, `PlayabilityBadge`, `SourceComparisonTable`, `ThemedText`/`ThemedView`, etc.)
- `src/hooks/` — custom hooks and context providers (`use-favorites`, `use-course-sort`, `use-location`, `use-courses-weather`, `use-course-weather`, `use-current-hour`, `use-theme`, `use-color-scheme` + `.web` variant)
- `src/lib/` — business logic:
  - `lib/weather/` — API clients + aggregation (core data layer): `fmi.ts`, `yr.ts`, `open-meteo.ts`, `aggregate.ts`, `types.ts`, `index.ts` (orchestration, caching, timeouts)
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
/courses/[id]        -> course detail (stack)
/favorites           -> favorites list (tab)
/settings            -> settings (root stack)
```

Provider nesting in [src/app/_layout.tsx](src/app/_layout.tsx): `LanguageProvider` -> `FavoritesProvider` -> `SortModeProvider` -> `ThemeProvider`.

## Data flow

```
golf-courses.json
  -> useLocation()               (GPS, Kuopio fallback if denied)
  -> sortByDistance()
  -> useCoursesWeather() / useCourseWeather()
  -> fetchAllSources(lat, lon)   [src/lib/weather/index.ts]
       - fetchFmi()        FMI WFS XML (Harmonie)
       - fetchYr()         MET Norway Locationforecast (requires User-Agent header)
       - fetchOpenMeteo()  Open-Meteo hourly forecast
     (parallel, 10s timeout per source, errors isolated per source)
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
- Weather state is local to hooks, not global (in-memory `Map` cache, 30 min TTL, always enabled, only caches results with at least one successful source)

## Common task pointers

- Add/edit golf courses -> [src/data/golf-courses.json](src/data/golf-courses.json)
- Change weather fetching/aggregation -> [src/lib/weather/](src/lib/weather)
- Change playability thresholds/labels -> [src/lib/golf.ts](src/lib/golf.ts)
- Add/edit UI strings -> update **both** [src/i18n/translations/fi.ts](src/i18n/translations/fi.ts) and [src/i18n/translations/en.ts](src/i18n/translations/en.ts)

## Commands

- `npm run start` / `npm run ios` / `npm run android` / `npm run web` — dev server
- `npm run lint` — ESLint; run before committing (no test suite exists)
- `expo export -p web` — production web build to `dist/` (used by Vercel via [vercel.json](vercel.json))

## Gotchas

- YR.no requires a `User-Agent` header or requests are rejected
- FMI responses are XML, parsed with `fast-xml-parser`
- List weather fetch runs with concurrency 4 and batches state updates ~every 1s
- Hour rollover happens at :45 past the hour (`useCurrentHour`), triggering a forced refresh
- Web hydration: some values (e.g. sun times) render as empty defaults until client-side hydration completes
- Some template leftovers are unused and safe to ignore/remove: `src/components/web-badge.tsx`, `hint-row.tsx`, `external-link.tsx`, `src/components/ui/collapsible.tsx`
