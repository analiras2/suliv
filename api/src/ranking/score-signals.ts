import { CookingFrequency, CookingLevel, TimeBucket } from '@prisma/client';

export interface ScoreSignals {
  dietCompatible: boolean;
  allergyConflict: boolean;
  difficultyCompatible: boolean;
  timeCompatible: boolean;
  popularThisWeek: boolean;
  isRecent: boolean;
  categoryPerformsWell: boolean;
  editorialBoostWeight: number;
}

export const SCORE_WEIGHTS = {
  DIET_COMPATIBLE: 40,
  ALLERGY_CONFLICT: -80,
  DIFFICULTY_COMPATIBLE: 20,
  TIME_COMPATIBLE: 15,
  POPULAR_THIS_WEEK: 15,
  IS_RECENT: 10,
  CATEGORY_PERFORMS_WELL: 10,
} as const;

/** §9.2 judgment call, calibration-pending: how many top-weekly-popularity candidates count as "popular". */
export const POPULAR_THIS_WEEK_TOP_N = 5;

/** §9.2 judgment call, calibration-pending: "recent" = approved within this many days. */
export const RECENCY_WINDOW_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** §9.2 judgment call, calibration-pending: time-bucket compatibility per cooking frequency. */
export const TIME_COMPATIBILITY: Record<CookingFrequency, TimeBucket[]> = {
  [CookingFrequency.quase_todo_dia]: [TimeBucket.ate_15, TimeBucket.quinze_30],
  [CookingFrequency.algumas_vezes_semana]: [
    TimeBucket.ate_15,
    TimeBucket.quinze_30,
    TimeBucket.trinta_60,
  ],
  [CookingFrequency.raramente]: [
    TimeBucket.ate_15,
    TimeBucket.quinze_30,
    TimeBucket.trinta_60,
    TimeBucket.sessenta_mais,
  ],
};

export function hasAllergyConflict(
  recipeAllergenIds: Set<string>,
  userAllergenIds: Set<string>,
): boolean {
  for (const allergenId of recipeAllergenIds) {
    if (userAllergenIds.has(allergenId)) {
      return true;
    }
  }
  return false;
}

export function isDifficultyCompatible(
  recipeDifficulty: CookingLevel,
  userCookingLevel: CookingLevel | null,
): boolean {
  return userCookingLevel !== null && recipeDifficulty === userCookingLevel;
}

export function isTimeCompatible(
  recipeTimeBucket: TimeBucket,
  userCookingFrequency: CookingFrequency | null,
): boolean {
  if (!userCookingFrequency) {
    return false;
  }
  return TIME_COMPATIBILITY[userCookingFrequency].includes(recipeTimeBucket);
}

export function isPopularThisWeek(
  weeklyPopularity: number,
  topNCutoff: number,
): boolean {
  return weeklyPopularity >= topNCutoff;
}

/** Popularity value at the top-N boundary; recipes at or above it qualify as "popular this week". */
export function computeTopNCutoff(
  popularities: number[],
  topN: number,
): number {
  if (popularities.length === 0) {
    return Infinity;
  }
  const sorted = [...popularities].sort((a, b) => b - a);
  const index = Math.min(topN, sorted.length) - 1;
  return sorted[index];
}

export function isRecentRecipe(approvedAt: Date | null, now: Date): boolean {
  if (!approvedAt) {
    return false;
  }
  return (
    now.getTime() - approvedAt.getTime() <= RECENCY_WINDOW_DAYS * MS_PER_DAY
  );
}

export function categoryPerformsWell(
  categoryAverage: number,
  crossCategoryMedian: number,
): boolean {
  return categoryAverage >= crossCategoryMedian;
}

export function computeMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function computeEditorialBoostWeight(
  boost: { startsAt: Date; endsAt: Date; weight: number } | null,
  now: Date,
): number {
  if (!boost || boost.startsAt > now || boost.endsAt < now) {
    return 0;
  }
  return boost.weight;
}

export function calculateTotalScore(signals: ScoreSignals): number {
  let score = 0;
  if (signals.dietCompatible) score += SCORE_WEIGHTS.DIET_COMPATIBLE;
  if (signals.allergyConflict) score += SCORE_WEIGHTS.ALLERGY_CONFLICT;
  if (signals.difficultyCompatible)
    score += SCORE_WEIGHTS.DIFFICULTY_COMPATIBLE;
  if (signals.timeCompatible) score += SCORE_WEIGHTS.TIME_COMPATIBLE;
  if (signals.popularThisWeek) score += SCORE_WEIGHTS.POPULAR_THIS_WEEK;
  if (signals.isRecent) score += SCORE_WEIGHTS.IS_RECENT;
  if (signals.categoryPerformsWell)
    score += SCORE_WEIGHTS.CATEGORY_PERFORMS_WELL;
  score += signals.editorialBoostWeight;
  return score;
}
