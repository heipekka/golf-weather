# Weather Source Coverage by Country

This document describes which of the app's three weather sources provide data for
each country represented in the golf course list, and how the app behaves when a
source has no data for a given location.

## Sources

The app aggregates three weather sources, each queried by latitude/longitude in
[`src/lib/weather/index.ts`](../src/lib/weather/index.ts) via `fetchAllSources`:

| Source | Client | Endpoint |
|---|---|---|
| Open-Meteo | [`open-meteo.ts`](../src/lib/weather/open-meteo.ts) | `https://api.open-meteo.com/v1/forecast` |
| YR.no (MET Norway) | [`yr.ts`](../src/lib/weather/yr.ts) | `https://api.met.no/weatherapi/locationforecast/2.0/compact` |
| FMI (Ilmatieteen laitos) | [`fmi.ts`](../src/lib/weather/fmi.ts) | `https://opendata.fmi.fi/wfs` (stored query `fmi::forecast::harmonie::surface::point::simple`) |

## Countries in the course list

[`src/data/golf-courses.json`](../src/data/golf-courses.json) contains courses in
six countries:

- Finland
- Estonia
- Sweden
- Norway
- Denmark
- Spain (Costa del Sol — Marbella / Málaga area)

## Coverage matrix

| Country | Open-Meteo | YR.no | FMI |
|---|:---:|:---:|:---:|
| Finland | ✅ | ✅ | ✅ |
| Estonia | ✅ | ✅ | ✅ |
| Sweden | ✅ | ✅ | ✅ |
| Norway | ✅ | ✅ | ✅ |
| Denmark | ✅ | ✅ | ✅ |
| Spain | ✅ | ✅ | ❌ |

**Summary:** Open-Meteo and YR.no are global and cover every course. FMI uses the
regional HARMONIE model, whose domain covers the Nordic/Baltic region only. It
returns data for Finland, Estonia, Sweden, Norway, and Denmark, but **not** for
Spain.

### FMI regional limitation

FMI's `fmi::forecast::harmonie::surface::point::simple` stored query is backed by
the HARMONIE numerical weather model, which only spans the Nordic/Baltic area. For
points outside that domain, FMI returns a WFS `ExceptionReport` instead of data.

Verified against the live API:

- **Spain** (Marbella `36.51, -4.94`) → exception: `No data available for 'Nueva Andalucia'!`
- **Finland** (Helsinki `60.22, 24.82`) → `numberReturned="50"`
- **Denmark** (south `54.86, 11.92`, Bornholm `55.12, 14.73`) → `numberReturned="50"`
- **Sweden** (Falsterbo `55.38, 12.82`) → `numberReturned="50"`
- **Norway** (Lofoten `68.33, 14.09`) → `numberReturned="50"`
- **Estonia** (Saaremaa `58.25, 22.50`, Otepää `58.05, 26.41`) → `numberReturned="50"`

## App behavior when a source has no data

The missing FMI data for Spain degrades gracefully by design; nothing breaks:

- **Per-source error isolation** — each source is fetched inside its own
  `try/catch` in `fetchSource`, so FMI's failure never blocks Open-Meteo or YR.no
  ([`src/lib/weather/index.ts`](../src/lib/weather/index.ts)).
- **Aggregation uses whatever succeeded** — `aggregateForecasts` averages across
  the sources that returned data, so Spanish courses are backed by 2 of 3 sources
  (YR.no + Open-Meteo).
- **Caching stays correct** — a result is only cached if at least one source
  returned data (`data.aggregated.length > 0`), which is always the case here.

### User-facing impact

- For Spanish courses, the source comparison table
  ([`SourceComparisonTable`](../src/components/source-comparison-table.tsx)) shows
  no FMI column/values; forecasts still render from the other two sources.
- For all Nordic and Baltic courses, all three sources contribute.

## Extending coverage

To provide three-source coverage for Spain (or other regions outside FMI's
domain), add another global or region-specific source (e.g. AEMET for Spain)
alongside the existing clients in [`src/lib/weather/`](../src/lib/weather):

1. Add a new client module following the shape of the existing ones (return a
   `SourceForecast` from `types.ts`).
2. Register it in the `SourceId` type, `SOURCE_LABELS`, `SOURCE_ORDER`, and the
   `fetchSource` switch in `index.ts`.
3. It will automatically flow through aggregation, scoring, and the UI.
