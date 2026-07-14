# Weather API Reference

This document is an offline reference for the three weather APIs the app calls
client-side ([src/lib/weather/](../src/lib/weather)), so their request/response
shapes don't need to be re-discovered by fetching live demo data every time.
Full raw sample responses are captured under
[docs/weather-api-samples/](weather-api-samples) (see [Sample fixtures](#sample-fixtures)).

See also [docs/weather-source-coverage.md](weather-source-coverage.md) for
which sources cover which countries.

## Contents

- [Open-Meteo](#open-meteo)
- [YR.no (MET Norway)](#yrno-met-norway)
- [FMI (Ilmatieteen laitos)](#fmi-ilmatieteen-laitos)
- [Normalized types](#normalized-types)
- [Aggregation](#aggregation)
- [Sample fixtures](#sample-fixtures)

---

## Open-Meteo

Client: [src/lib/weather/open-meteo.ts](../src/lib/weather/open-meteo.ts)

- **Endpoint:** `GET https://api.open-meteo.com/v1/forecast`
- **Auth / headers:** none required
- **Query params used by the app:**

  | Param | Value |
  |---|---|
  | `latitude`, `longitude` | course coordinates |
  | `hourly` | `temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,weather_code` |
  | `windspeed_unit` | `ms` (otherwise Open-Meteo defaults to km/h) |
  | `timezone` | `UTC` |
  | `forecast_days` | `3` |

### Response shape

Column-oriented: one top-level `hourly` object whose keys are each a parallel
array, all indexed by the same position as `hourly.time`.

```json
{
  "latitude": 60.25,
  "longitude": 24.75,
  "generationtime_ms": 0.45,
  "utc_offset_seconds": 0,
  "timezone": "GMT",
  "elevation": 20.0,
  "hourly_units": {
    "temperature_2m": "°C",
    "wind_speed_10m": "m/s",
    "weather_code": "wmo code"
  },
  "hourly": {
    "time": ["2026-07-14T00:00", "2026-07-14T01:00", "..."],
    "temperature_2m": [18.3, 17.4, "..."],
    "apparent_temperature": [17.8, 16.7, "..."],
    "precipitation": [0.0, 0.0, "..."],
    "precipitation_probability": [4, 3, "..."],
    "wind_speed_10m": ["..."],
    "wind_gusts_10m": ["..."],
    "wind_direction_10m": ["..."],
    "cloud_cover": ["..."],
    "weather_code": [3, 3, "..."]
  }
}
```

### Quirks

- `hourly.time` entries are local-ish ISO strings **without a UTC offset or
  trailing `Z`** even though `timezone=UTC` was requested (e.g.
  `"2026-07-14T00:00"`). The client appends `:00Z` manually
  (`` `${time}:00Z` ``) to get a valid UTC ISO timestamp — see
  [open-meteo.ts:57-58](../src/lib/weather/open-meteo.ts).
- Returns exactly `forecast_days * 24` hours starting at local day boundary
  00:00 UTC, so the first entries can be a few hours in the past relative to
  "now".
- `weather_code` is the numeric WMO code; the app stores it as
  `ForecastPoint.weatherCode` but does not currently render an icon from it
  (icons for FMI/YR use `symbol`, which Open-Meteo never sets — see below).
- Global coverage — always returns data regardless of location (Nordic,
  Baltic, or Spain).

---

## YR.no (MET Norway)

Client: [src/lib/weather/yr.ts](../src/lib/weather/yr.ts)

- **Endpoint:** `GET https://api.met.no/weatherapi/locationforecast/2.0/compact`
- **Auth / headers:** requires a descriptive `User-Agent` header per the
  [MET Norway Terms of Service](https://api.met.no/doc/TermsOfService); the
  app sends `golf-weather-app/1.0 github.com/heipekka/golf-weather`. Browsers
  may silently strip custom `User-Agent` headers, which can break this
  request on web.
- **Query params:** `lat`, `lon` (4 decimal places, via `toFixed(4)`)

### Response shape

Row-oriented: a GeoJSON `Feature` with `properties.timeseries`, an array of
per-instant entries. Each entry nests forecasts for different look-ahead
windows (`instant`, `next_1_hours`, `next_6_hours`, `next_12_hours`); the app
only reads `instant` and `next_1_hours`.

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [24.82, 60.22, 16] },
  "properties": {
    "meta": { "updated_at": "2026-07-14T19:28:25Z", "units": { "...": "..." } },
    "timeseries": [
      {
        "time": "2026-07-14T20:00:00Z",
        "data": {
          "instant": {
            "details": {
              "air_temperature": 19.3,
              "wind_speed": 1.9,
              "wind_from_direction": 261.0,
              "cloud_area_fraction": 16.3,
              "air_pressure_at_sea_level": 1019.4,
              "relative_humidity": 80.6
            }
          },
          "next_1_hours": {
            "summary": { "symbol_code": "fair_night" },
            "details": { "precipitation_amount": 0.0 }
          },
          "next_6_hours": { "summary": { "...": "..." }, "details": { "...": "..." } },
          "next_12_hours": { "summary": { "...": "..." }, "details": {} }
        }
      }
    ]
  }
}
```

### Quirks

- `timeseries` can be longer than needed (multiple days at decreasing
  frequency); the client truncates to the first `MAX_HOURS = 72` entries
  ([yr.ts:10](../src/lib/weather/yr.ts)).
- No wind gust field at all — `windGust` is always `null` for this source.
- No native "feels like" temperature or precipitation probability — both
  `apparentTemperature` (computed via wind chill,
  [feels-like.ts](../src/lib/weather/feels-like.ts)) and
  `precipitationProbability` (always `null`) are derived/absent.
- `symbol` comes from `next_1_hours.summary.symbol_code`, a MET Norway symbol
  identifier like `fair_night`, `partlycloudy_day`, `clearsky_night` — day/night
  variants are baked into the string by MET Norway itself.
- Later entries in `timeseries` drop to 6-hour or daily resolution and may
  omit `next_1_hours` entirely; the app doesn't special-case this, so
  `precipitation`/`symbol` become `null` for those far-future hours.
- Global coverage.

---

## FMI (Ilmatieteen laitos)

Client: [src/lib/weather/fmi.ts](../src/lib/weather/fmi.ts)

- **Endpoint:** `GET https://opendata.fmi.fi/wfs`
- **Auth / headers:** none required
- **Query params:**

  | Param | Value |
  |---|---|
  | `service` | `WFS` |
  | `version` | `2.0.0` |
  | `request` | `getFeature` |
  | `storedquery_id` | `fmi::forecast::harmonie::surface::point::simple` |
  | `latlon` | `<lat>,<lon>` |
  | `parameters` | `Temperature,WindSpeedMS,WindGust,WindDirection,Precipitation1h,TotalCloudCover` |
  | `timestep` | `60` |

### Response shape

XML (WFS `FeatureCollection`), parsed with `fast-xml-parser`
(`removeNSPrefix: true, ignoreAttributes: true`). It is **not** column- or
even row-oriented per hour — it's one flat list of `<wfs:member>` elements,
each holding a *single (time, parameter) pair*. The client groups these back
into per-hour rows by `Time` ([fmi.ts:66-99](../src/lib/weather/fmi.ts)).

```xml
<wfs:FeatureCollection timeStamp="2026-07-14T20:20:50Z" numberReturned="300" numberMatched="300" ...>
  <wfs:member>
    <BsWfs:BsWfsElement gml:id="BsWfsElement.1.1.1">
      <BsWfs:Location>
        <gml:Point srsDimension="2" srsName="...EPSG/0/4326">
          <gml:pos>60.22000 24.82000 </gml:pos>
        </gml:Point>
      </BsWfs:Location>
      <BsWfs:Time>2026-07-14T21:00:00Z</BsWfs:Time>
      <BsWfs:ParameterName>Temperature</BsWfs:ParameterName>
      <BsWfs:ParameterValue>17.4</BsWfs:ParameterValue>
    </BsWfs:BsWfsElement>
  </wfs:member>
  <wfs:member>
    <!-- next parameter, same Time, e.g. WindSpeedMS -->
  </wfs:member>
  <!-- ... one <wfs:member> per (hour, parameter) combination ... -->
</wfs:FeatureCollection>
```

With 6 requested parameters and `numberReturned="300"`, that's `300 / 6 = 50`
distinct hours in this sample (matches the `numberReturned="50"` figures
recorded for other Nordic/Baltic points in
[weather-source-coverage.md](weather-source-coverage.md)).

### Quirks

- **Nordic/Baltic-only.** The `harmonie` model domain doesn't cover Spain; a
  request outside the domain returns a WFS `ExceptionReport` instead of
  `member` elements (e.g. `No data available for 'Nueva Andalucia'!` — already
  documented in [weather-source-coverage.md](weather-source-coverage.md)).
  The client's `toArray(parsed.FeatureCollection?.member)` call simply
  produces an empty array in that case rather than throwing, so
  `hourly` ends up `[]` for out-of-domain points.
- One `<wfs:member>` per parameter *per hour*, not per hour — the client
  reconstructs hourly rows with a `Map` keyed by `Time`
  ([fmi.ts:66-99](../src/lib/weather/fmi.ts)).
- No precipitation probability, weather code, or symbol at all — all three
  are always `null` for this source.
- No native apparent temperature — computed via wind chill like YR
  ([feels-like.ts](../src/lib/weather/feels-like.ts)).
- `fast-xml-parser` with `ignoreAttributes: true` means attributes like
  `numberReturned` or `gml:id` are dropped; only element text content is
  read.

---

## Normalized types

All three clients produce a `SourceForecast` (defined in
[src/lib/weather/types.ts](../src/lib/weather/types.ts)) with an `hourly:
ForecastPoint[]` array. Field-by-field mapping:

| `ForecastPoint` field | FMI | YR.no | Open-Meteo |
|---|---|---|---|
| `time` | `BsWfs:Time` | `timeseries[].time` | `hourly.time[i]` + `":00Z"` appended |
| `temperature` | `Temperature` | `instant.details.air_temperature` | `hourly.temperature_2m[i]` |
| `apparentTemperature` | computed (wind chill) | computed (wind chill) | `hourly.apparent_temperature[i]` (native) |
| `windSpeed` | `WindSpeedMS` | `instant.details.wind_speed` | `hourly.wind_speed_10m[i]` |
| `windGust` | `WindGust` | always `null` | `hourly.wind_gusts_10m[i]` |
| `windDirection` | `WindDirection` | `instant.details.wind_from_direction` | `hourly.wind_direction_10m[i]` |
| `precipitation` | `Precipitation1h` | `next_1_hours.details.precipitation_amount` | `hourly.precipitation[i]` |
| `precipitationProbability` | always `null` | always `null` | `hourly.precipitation_probability[i]` |
| `cloudCover` | `TotalCloudCover` | `instant.details.cloud_area_fraction` | `hourly.cloud_cover[i]` |
| `weatherCode` | always `null` | always `null` | `hourly.weather_code[i]` (WMO code) |
| `symbol` | always `null` | `next_1_hours.summary.symbol_code` | always `null` |

The wind-chill fallback used for FMI and YR is implemented in
[src/lib/weather/feels-like.ts](../src/lib/weather/feels-like.ts): it only
lowers the apparent temperature below 10°C with wind above ~4.8 km/h (1.3
m/s), and otherwise returns the raw temperature unchanged.

## Aggregation

[src/lib/weather/aggregate.ts](../src/lib/weather/aggregate.ts) turns the
per-source `ForecastPoint[]` arrays into a single `AggregatedPoint[]`:

- Every point's `time` is bucketed to its containing UTC hour
  (`hourKey`, truncates minutes/seconds).
- Sources that errored are skipped entirely; sources without data for a
  given hour simply don't contribute a point to that bucket.
- Each numeric field is the arithmetic mean of all non-null values across
  whichever sources have a point in that hour bucket (`average()`), so an
  hour backed by only 2 of 3 sources (e.g. Spain, where FMI has no data) is
  still produced, just averaged over fewer inputs.
- `sourceCount` on each `AggregatedPoint` records how many source points fed
  into that hour's average, so the UI can indicate partial coverage.
- `AggregatedPoint` has no `weatherCode` or `symbol` field — those are only
  ever read per-source (e.g. for icons), not averaged.

## Sample fixtures

Raw, unmodified sample responses (JSON pretty-printed; FMI kept as returned
XML) for Helsinki (`60.22, 24.82`), captured 2026-07-14, live under
[docs/weather-api-samples/](weather-api-samples):

| File | Source | Notes |
|---|---|---|
| [openmeteo.sample.json](weather-api-samples/openmeteo.sample.json) | Open-Meteo | 3 days × 24h hourly arrays |
| [yr.sample.json](weather-api-samples/yr.sample.json) | YR.no | full `timeseries`, decreasing resolution over time |
| [fmi.sample.xml](weather-api-samples/fmi.sample.xml) | FMI | 50 hours × 6 parameters = 300 `<wfs:member>` elements |

These are point-in-time snapshots for reference only — timestamps, values,
and even field presence (e.g. YR's far-future entries) will differ on a live
request. Re-fetch only if the upstream response *shape* is suspected to have
changed; the values themselves aren't meaningful once stale.
