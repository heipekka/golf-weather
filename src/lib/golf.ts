export type PlayabilityLabel = 'Excellent' | 'Good' | 'Fair' | 'Hot' | 'Poor' | 'Bad';

export type PlayabilityConditions = {
  temperature: number | null;
  windSpeed: number | null;
  windGust: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
};

/** Stable codes for playability reasons; UI resolves these to translated text. */
export type PlayabilityReasonCode = 'badConditions' | 'poorConditions' | 'fairConditions' | 'hot' | 'hotSpell';

export type Playability = {
  score: number;
  label: PlayabilityLabel;
  reasons: PlayabilityReasonCode[];
  /** Set when the window swings chronologically enough to show a divided badge. */
  trend?: { early: PlayabilityLabel; late: PlayabilityLabel };
};

export const PlayabilityColors: Record<PlayabilityLabel, string> = {
  Excellent: '#1F9254',
  Good: '#3C87F7',
  Fair: '#D98C1F',
  Hot: '#E0662B',
  Poor: '#D9483C',
  Bad: '#B3261E',
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

const RANK_TIER: PlayabilityLabel[] = ['Bad', 'Poor', 'Fair', 'Good', 'Excellent'];

/** Representative score for each tier, used for the `weather`/`combined` sort ranking. */
const TIER_SCORE: Record<PlayabilityLabel, number> = {
  Excellent: 95,
  Good: 75,
  Hot: 55,
  Fair: 45,
  Poor: 25,
  Bad: 8,
};

const HOT_TEMPERATURE_C = 27;

const BAD_PRECIPITATION_MM = 2;
const BAD_TEMPERATURE_C = 3;
const BAD_WIND_MS = 14;

const POOR_PRECIPITATION_MM = 1;
const POOR_TEMPERATURE_C = 6;
const POOR_WIND_MS = 11;

const FAIR_PRECIPITATION_MM = 0.5;
const FAIR_TEMPERATURE_C = 10;
const FAIR_WIND_MS = 8;

const GOOD_TEMPERATURE_C = 16;
const GOOD_WIND_MS = 5;

/**
 * Rounds temperature to the same whole-degree precision shown in the UI
 * before classification, so the label never disagrees with the number the
 * user can actually see. Wind and precipitation are left at full precision.
 */
function roundToDisplay(conditions: PlayabilityConditions): PlayabilityConditions {
  return {
    ...conditions,
    temperature: conditions.temperature === null ? null : Math.round(conditions.temperature),
  };
}

/**
 * Classifies a single hour's conditions into a playability tier using hard,
 * OR-based thresholds: any one condition (rain, cold, wind) is enough to
 * drag the hour down a tier, since a single bad factor can ruin a round.
 * Evaluated worst-first, so the first matching tier wins.
 */
export function classifyHour(conditions: PlayabilityConditions): PlayabilityLabel {
  const { temperature, windSpeed, precipitation } = roundToDisplay(conditions);
  const isHot = temperature !== null && temperature > HOT_TEMPERATURE_C;

  if (
    (precipitation !== null && precipitation > BAD_PRECIPITATION_MM) ||
    (temperature !== null && temperature < BAD_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > BAD_WIND_MS)
  ) {
    return 'Bad';
  }

  if (
    (precipitation !== null && precipitation > POOR_PRECIPITATION_MM) ||
    (temperature !== null && temperature < POOR_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > POOR_WIND_MS)
  ) {
    return 'Poor';
  }

  if (
    (precipitation !== null && precipitation > FAIR_PRECIPITATION_MM) ||
    (temperature !== null && temperature < FAIR_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > FAIR_WIND_MS)
  ) {
    return 'Fair';
  }

  // Good/Excellent both count as "otherwise pleasant", so a hot spell can
  // override either of them without being masked by an unrelated factor
  // (e.g. a bit of wind) that already capped the tier at Good.
  if (
    (temperature !== null && temperature < GOOD_TEMPERATURE_C) ||
    (windSpeed !== null && windSpeed > GOOD_WIND_MS)
  ) {
    return isHot ? 'Hot' : 'Good';
  }

  return isHot ? 'Hot' : 'Excellent';
}

function reasonsFor(label: PlayabilityLabel): PlayabilityReasonCode[] {
  switch (label) {
    case 'Bad':
      return ['badConditions'];
    case 'Poor':
      return ['poorConditions'];
    case 'Fair':
      return ['fairConditions'];
    case 'Hot':
      return ['hot'];
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
export function scorePlayability(conditions: PlayabilityConditions): Playability {
  const label = classifyHour(conditions);
  return { score: TIER_SCORE[label], label, reasons: reasonsFor(label) };
}

/** Minimum number of hours (out of the window) needed for a tier/spell to "count". */
const WINDOW_MAJORITY_HOURS = 4;

/** Minimum tier-rank gap between the early and late half of the window to show a divided badge. */
const SPLIT_RANK_DELTA = 2;

/** Minimum window length needed for a chronological early/late split to be meaningful. */
const SPLIT_MIN_HOURS = 4;

function majorityThreshold(windowLength: number): number {
  return windowLength >= WINDOW_MAJORITY_HOURS + 3
    ? WINDOW_MAJORITY_HOURS
    : Math.ceil((windowLength + 1) / 2);
}

/**
 * Scores a window of upcoming hours (e.g. the next 7) rather than a single
 * point in time, so a course isn't marked great just because the current
 * hour happens to look fine before a spell of bad weather.
 *
 * Each hour is classified independently, then:
 * - A `Hot` spell (enough hot hours) overrides everything else.
 * - If the window swings widely (e.g. Excellent down to Fair), the badge
 *   settles on the tier roughly in the middle rather than the extremes.
 * - Otherwise the badge is the worst tier if it covers enough of the
 *   window, or the best tier if the bad hours are only a minority.
 */
export function scoreWindow(hours: PlayabilityConditions[]): Playability {
  if (hours.length === 0) {
    return { score: 0, label: 'Fair', reasons: [] };
  }

  const threshold = majorityThreshold(hours.length);
  const rounded = hours.map(roundToDisplay);

  const hotHours = rounded.filter(
    ({ temperature }) => temperature !== null && temperature > HOT_TEMPERATURE_C
  ).length;
  if (hotHours >= threshold) {
    return { score: TIER_SCORE.Hot, label: 'Hot', reasons: ['hotSpell'] };
  }

  const tiers = rounded.map((hour) => classifyHour(hour));
  const ranks = tiers.map((tier) => TIER_RANK[tier]);
  const bestRank = Math.max(...ranks);
  const worstRank = Math.min(...ranks);

  let resultRank: number;
  if (bestRank - worstRank >= 2) {
    resultRank = Math.round((bestRank + worstRank) / 2);
  } else {
    const worstCount = ranks.filter((rank) => rank === worstRank).length;
    resultRank = worstCount >= threshold ? worstRank : bestRank;
  }

  const label = RANK_TIER[resultRank];
  const trend = detectTrend(hours);
  return { score: TIER_SCORE[label], label, reasons: reasonsFor(label), trend };
}

/**
 * Detects a significant chronological swing within the window (e.g. bad now,
 * good later) by comparing a representative tier for the early vs. late
 * half. Returns undefined when the window is too short to split meaningfully
 * or the halves are close enough in tier that a divided badge would be noise.
 */
function detectTrend(
  hours: PlayabilityConditions[]
): Playability['trend'] {
  if (hours.length < SPLIT_MIN_HOURS) return undefined;

  const midpoint = Math.ceil(hours.length / 2);
  const early = scoreWindow(hours.slice(0, midpoint)).label;
  const late = scoreWindow(hours.slice(midpoint)).label;

  if (Math.abs(TIER_RANK[early] - TIER_RANK[late]) < SPLIT_RANK_DELTA) {
    return undefined;
  }

  return { early, late };
}
