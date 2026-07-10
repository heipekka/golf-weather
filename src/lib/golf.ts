export type PlayabilityLabel =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Hot"
  | "Poor"
  | "Bad"
  | "Dark";

export type PlayabilityConditions = {
  temperature: number | null;
  windSpeed: number | null;
  windGust: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  /** True when there is no playable light (sun below civil twilight); overrides weather-based classification. */
  isDark?: boolean;
};

/** Stable codes for playability reasons; UI resolves these to translated text. */
export type PlayabilityReasonCode =
  | "badConditions"
  | "poorConditions"
  | "fairConditions"
  | "hot"
  | "hotSpell";

export type Playability = {
  score: number;
  label: PlayabilityLabel;
  reasons: PlayabilityReasonCode[];
  /** Set when the window swings chronologically enough to show a divided badge. */
  trend?: { early: PlayabilityLabel; late: PlayabilityLabel };
};

export const PlayabilityColors: Record<PlayabilityLabel, string> = {
  Excellent: "#1F9254",
  Good: "#3C87F7",
  Fair: "#D98C1F",
  Hot: "#E0662B",
  Poor: "#D9483C",
  Bad: "#B3261E",
  Dark: "#5B6178",
};

/**
 * Ladder position for each tier, worst to best; used when aggregating a
 * window of hours. `Dark` ranks below every weather tier so a dark-heavy
 * half always wins as the worse half when computing the main label (see
 * `scoreWindow`).
 */
const TIER_RANK: Record<PlayabilityLabel, number> = {
  Dark: -1,
  Bad: 0,
  Poor: 1,
  Fair: 2,
  Good: 3,
  Hot: 3,
  Excellent: 4,
};

const RANK_TIER: PlayabilityLabel[] = [
  "Bad",
  "Poor",
  "Fair",
  "Good",
  "Excellent",
];

/** Representative score for each tier, used for the `weather`/`combined` sort ranking. */
const TIER_SCORE: Record<PlayabilityLabel, number> = {
  Excellent: 95,
  Good: 75,
  Hot: 55,
  Fair: 45,
  Poor: 25,
  Bad: 8,
  Dark: 0,
};

const HOT_TEMPERATURE_C = 30;

const BAD_PRECIPITATION_MM = 2;
const BAD_TEMPERATURE_C = 3;
const BAD_WIND_MS = 13;

const POOR_PRECIPITATION_MM = 1;
const POOR_TEMPERATURE_C = 6;
const POOR_WIND_MS = 10;

const FAIR_PRECIPITATION_MM = 0.25;
const FAIR_TEMPERATURE_C = 10;
const FAIR_WIND_MS = 8;

const GOOD_PRECIPITATION_MM = 0.1;
const GOOD_TEMPERATURE_C = 16;
const GOOD_WIND_MS = 6;

/** Wind range where a breeze offsets a hot temperature into `Excellent` instead of `Hot`. */
const HOT_BREEZE_MIN_MS = 4;
const HOT_BREEZE_MAX_MS = 6;

/**
 * Rounds each condition to the same precision shown in the UI (whole degrees
 * for temperature, one decimal for wind and precipitation) before
 * classification, so the label never disagrees with the numbers the user
 * can actually see.
 */
function roundToDisplay(
  conditions: PlayabilityConditions,
): PlayabilityConditions {
  return {
    ...conditions,
    temperature:
      conditions.temperature === null
        ? null
        : Math.round(conditions.temperature),
    windSpeed:
      conditions.windSpeed === null
        ? null
        : Number(conditions.windSpeed.toFixed(1)),
    precipitation:
      conditions.precipitation === null
        ? null
        : Number(conditions.precipitation.toFixed(1)),
  };
}

/**
 * Resolves the tier for a hot hour (temperature > `HOT_TEMPERATURE_C`) based
 * on wind: a light breeze (`HOT_BREEZE_MIN_MS`-`HOT_BREEZE_MAX_MS`) offsets
 * the heat and reads as `Excellent`; calm air (below that range, or unknown)
 * keeps the hour `Hot`; anything windier than the breeze range falls through
 * to the wind-driven tier that was already computed, so a hot-and-windy hour
 * isn't relabeled `Hot` on top of being downgraded for wind.
 */
function hotPleasant(
  windSpeed: number | null,
  base: PlayabilityLabel,
): PlayabilityLabel {
  if (
    windSpeed !== null &&
    windSpeed >= HOT_BREEZE_MIN_MS &&
    windSpeed <= HOT_BREEZE_MAX_MS
  ) {
    return "Excellent";
  }
  if (windSpeed === null || windSpeed < HOT_BREEZE_MIN_MS) return "Hot";
  return base;
}

/**
 * Classifies a single hour's conditions into a playability tier using hard,
 * OR-based thresholds: any one condition (rain, cold, wind) is enough to
 * drag the hour down a tier, since a single bad factor can ruin a round.
 * Evaluated worst-first, so the first matching tier wins.
 */
export function classifyHour(
  conditions: PlayabilityConditions,
): PlayabilityLabel {
  if (conditions.isDark) return "Dark";

  const { temperature, windSpeed, precipitation } = roundToDisplay(conditions);
  const isHot = temperature !== null && temperature > HOT_TEMPERATURE_C;

  if (
    (precipitation !== null && precipitation > BAD_PRECIPITATION_MM) ||
    (temperature !== null && temperature < BAD_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > BAD_WIND_MS)
  ) {
    return "Bad";
  }

  if (
    (precipitation !== null && precipitation > POOR_PRECIPITATION_MM) ||
    (temperature !== null && temperature < POOR_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > POOR_WIND_MS)
  ) {
    return "Poor";
  }

  if (
    (precipitation !== null && precipitation >= FAIR_PRECIPITATION_MM) ||
    (temperature !== null && temperature < FAIR_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > FAIR_WIND_MS)
  ) {
    return "Fair";
  }

  // Good/Excellent both count as "otherwise pleasant", so a hot spell can
  // override either of them without being masked by an unrelated factor
  // (e.g. a bit of wind) that already capped the tier at Good.
  if (
    (precipitation !== null && precipitation > GOOD_PRECIPITATION_MM) ||
    (temperature !== null && temperature < GOOD_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed >= GOOD_WIND_MS)
  ) {
    return isHot ? hotPleasant(windSpeed, "Good") : "Good";
  }

  return isHot ? hotPleasant(windSpeed, "Excellent") : "Excellent";
}

function reasonsFor(label: PlayabilityLabel): PlayabilityReasonCode[] {
  switch (label) {
    case "Bad":
      return ["badConditions"];
    case "Poor":
      return ["poorConditions"];
    case "Fair":
      return ["fairConditions"];
    case "Hot":
      return ["hot"];
    default:
      return [];
  }
}

/**
 * Scores a single hour's playability. Wind, rain, and temperature are
 * evaluated with OR logic, so any one poor factor is enough to lower the
 * tier — a single heavy rain shower shouldn't be masked by otherwise calm
 * conditions.
 */
export function scorePlayability(
  conditions: PlayabilityConditions,
): Playability {
  const label = classifyHour(conditions);
  return { score: TIER_SCORE[label], label, reasons: reasonsFor(label) };
}

/** Minimum number of hours (out of the window) needed for a tier/spell to "count". */
const WINDOW_MAJORITY_HOURS = 4;

/** Minimum raw-average tier-rank gap between the early and late half to show a divided badge. */
const SPLIT_AVG_DELTA = 1;

/** Minimum window length needed for a chronological early/late split to be meaningful. */
const SPLIT_MIN_HOURS = 4;

/** Number of hours at each end of the window used to compute the early/late split. */
const SPLIT_HALF_HOURS = 4;

/** Minimum number of dark hours within a split half for that half's main-label tier to read `Dark`. */
const DARK_HALF_HOURS = 3;

function majorityThreshold(windowLength: number): number {
  return windowLength >= WINDOW_MAJORITY_HOURS + 3
    ? WINDOW_MAJORITY_HOURS
    : Math.ceil((windowLength + 1) / 2);
}

/**
 * Raw average of the given hours' tier ranks. Used to summarize a half of
 * the window as a single number without being dominated by any single
 * extreme hour.
 */
function averageRank(hours: PlayabilityConditions[]): number {
  const ranks = hours.map((hour) => TIER_RANK[classifyHour(hour)]);
  return ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
}

/**
 * Resolves a half-window's raw average rank to a representative tier.
 * Normally rounded down, so a mixed half reads as its lower tier rather than
 * being flattered by its best hours — except at the top of the scale: a half
 * made up entirely of pleasant hours (Excellent/Good/Hot) rounds up instead,
 * so a single stray Good or Hot hour doesn't mask an otherwise Excellent
 * half. Any Fair/Poor/Bad hour disables this and keeps the strict floor.
 */
function halfTier(
  hours: PlayabilityConditions[],
  avg: number,
): PlayabilityLabel {
  const floored = RANK_TIER[Math.floor(avg)];
  if (
    floored === "Good" &&
    hours.every((hour) => {
      const label = classifyHour(hour);
      return label === "Excellent" || label === "Good" || label === "Hot";
    })
  ) {
    return RANK_TIER[Math.round(avg)];
  }
  return floored;
}

/**
 * Scores a window of upcoming hours (e.g. the next 7) rather than a single
 * point in time, so a course isn't marked great just because the current
 * hour happens to look fine before a spell of bad weather.
 *
 * Hours with no playable light (`isDark`) are set aside first for weather
 * classification — the window is only labeled `Dark` outright when every
 * hour in it is dark; otherwise the remaining daylight hours are classified
 * normally, so an early-morning tee time isn't penalized for the darkness
 * right at its start.
 *
 * Each remaining (light) hour is classified independently, then:
 * - A `Hot` spell (enough hot hours) overrides everything else, unless a
 *   split half is dark-heavy enough to itself read as `Dark` (see below).
 * - The first and last `SPLIT_HALF_HOURS` hours are each averaged into a
 *   representative tier via `halfTier` — rounded down so a mixed half reads
 *   as its lower tier rather than being flattered by its best hours, unless
 *   the half is entirely pleasant (Excellent/Good/Hot), in which case it
 *   rounds up; if the two raw averages differ considerably, the badge is
 *   divided into an early -> late trend using these light-only half-tiers.
 * - Separately, each split half of the *full* (unfiltered) window is
 *   checked for darkness: a half with `DARK_HALF_HOURS` or more dark hours
 *   is treated as `Dark` for the main label, even though the trend badge
 *   above still shows its light-based tier for that half.
 * - The main label (used when not divided, and for sorting) is always the
 *   worse of the two half-tiers (dark-aware), since a spell of bad weather
 *   or darkness anywhere in the window shouldn't be masked by a good spell
 *   elsewhere.
 */
export function scoreWindow(hours: PlayabilityConditions[]): Playability {
  if (hours.length === 0) {
    return { score: 0, label: "Fair", reasons: [] };
  }

  const lightHours = hours.filter((hour) => !hour.isDark);
  if (lightHours.length === 0) {
    return { score: TIER_SCORE.Dark, label: "Dark", reasons: [] };
  }

  const threshold = majorityThreshold(lightHours.length);
  const rounded = lightHours.map(roundToDisplay);

  const earlyDark = hours
    .slice(0, SPLIT_HALF_HOURS)
    .filter((hour) => hour.isDark).length;
  const lateDark = hours
    .slice(-SPLIT_HALF_HOURS)
    .filter((hour) => hour.isDark).length;

  const hotHours = rounded.filter(
    (hour) => classifyHour(hour) === "Hot",
  ).length;
  if (
    hotHours >= threshold &&
    earlyDark < DARK_HALF_HOURS &&
    lateDark < DARK_HALF_HOURS
  ) {
    return { score: TIER_SCORE.Hot, label: "Hot", reasons: ["hotSpell"] };
  }

  const earlyHours = rounded.slice(0, SPLIT_HALF_HOURS);
  const lateHours = rounded.slice(-SPLIT_HALF_HOURS);
  const earlyAvg = averageRank(earlyHours);
  const lateAvg = averageRank(lateHours);

  const early = halfTier(earlyHours, earlyAvg);
  const late = halfTier(lateHours, lateAvg);

  // The main label additionally accounts for darkness: a half with enough
  // dark hours reads as `Dark` here even though `early`/`late` (used for the
  // trend badge below) stay light-only.
  const earlyMain = earlyDark >= DARK_HALF_HOURS ? "Dark" : early;
  const lateMain = lateDark >= DARK_HALF_HOURS ? "Dark" : late;
  const label =
    TIER_RANK[earlyMain] <= TIER_RANK[lateMain] ? earlyMain : lateMain;

  const trend =
    rounded.length >= SPLIT_MIN_HOURS &&
    Math.abs(earlyAvg - lateAvg) >= SPLIT_AVG_DELTA
      ? { early, late }
      : undefined;

  return { score: TIER_SCORE[label], label, reasons: reasonsFor(label), trend };
}
