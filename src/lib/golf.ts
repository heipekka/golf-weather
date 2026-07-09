export type PlayabilityLabel =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Hot"
  | "Poor"
  | "Bad";

export type PlayabilityConditions = {
  temperature: number | null;
  windSpeed: number | null;
  windGust: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
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
};

/** Ladder position for each tier, worst to best; used when aggregating a window of hours. */
const TIER_RANK: Record<PlayabilityLabel, number> = {
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
};

const HOT_TEMPERATURE_C = 30;

const BAD_PRECIPITATION_MM = 2;
const BAD_TEMPERATURE_C = 3;
const BAD_WIND_MS = 14;

const POOR_PRECIPITATION_MM = 1;
const POOR_TEMPERATURE_C = 6;
const POOR_WIND_MS = 11;

const FAIR_PRECIPITATION_MM = 0.5;
const FAIR_TEMPERATURE_C = 10;
const FAIR_WIND_MS = 8;

const GOOD_PRECIPITATION_MM = 0.1;
const GOOD_TEMPERATURE_C = 16;
const GOOD_WIND_MS = 5;

/**
 * Rounds temperature to the same whole-degree precision shown in the UI
 * before classification, so the label never disagrees with the number the
 * user can actually see. Wind and precipitation are left at full precision.
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
  };
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
    (windSpeed !== null && windSpeed > GOOD_WIND_MS)
  ) {
    return isHot ? "Hot" : "Good";
  }

  return isHot ? "Hot" : "Excellent";
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
 * Scores a window of upcoming hours (e.g. the next 7) rather than a single
 * point in time, so a course isn't marked great just because the current
 * hour happens to look fine before a spell of bad weather.
 *
 * Each hour is classified independently, then:
 * - A `Hot` spell (enough hot hours) overrides everything else.
 * - The first and last `SPLIT_HALF_HOURS` hours are each averaged into a
 *   representative tier, rounded down so a mixed half reads as its lower
 *   tier rather than being flattered by its best hours; if the two raw
 *   averages differ considerably, the badge is divided into an early ->
 *   late trend.
 * - The main label (used when not divided, and for sorting) is always the
 *   worse of the two half-tiers, since a spell of bad weather anywhere in
 *   the window shouldn't be masked by a good spell elsewhere.
 */
export function scoreWindow(hours: PlayabilityConditions[]): Playability {
  if (hours.length === 0) {
    return { score: 0, label: "Fair", reasons: [] };
  }

  const threshold = majorityThreshold(hours.length);
  const rounded = hours.map(roundToDisplay);

  const hotHours = rounded.filter(
    ({ temperature }) =>
      temperature !== null && temperature > HOT_TEMPERATURE_C,
  ).length;
  if (hotHours >= threshold) {
    return { score: TIER_SCORE.Hot, label: "Hot", reasons: ["hotSpell"] };
  }

  const earlyAvg = averageRank(rounded.slice(0, SPLIT_HALF_HOURS));
  const lateAvg = averageRank(rounded.slice(-SPLIT_HALF_HOURS));

  const early = RANK_TIER[Math.floor(earlyAvg)];
  const late = RANK_TIER[Math.floor(lateAvg)];

  const label = TIER_RANK[early] <= TIER_RANK[late] ? early : late;

  const trend =
    rounded.length >= SPLIT_MIN_HOURS &&
    Math.abs(earlyAvg - lateAvg) >= SPLIT_AVG_DELTA
      ? { early, late }
      : undefined;

  return { score: TIER_SCORE[label], label, reasons: reasonsFor(label), trend };
}
