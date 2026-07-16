import { CookingFrequency, CookingLevel, TimeBucket } from '@prisma/client';
import { isDietCompatible } from './diet-compatibility';
import {
  calculateTotalScore,
  categoryPerformsWell,
  computeEditorialBoostWeight,
  hasAllergyConflict,
  isDifficultyCompatible,
  isPopularThisWeek,
  isRecentRecipe,
  isTimeCompatible,
  RECENCY_WINDOW_DAYS,
  ScoreSignals,
} from './score-signals';

const NOW = new Date('2026-07-16T12:00:00.000Z');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('dietCompatible', () => {
  it.each([
    ['vegano', 'vegano'],
    ['vegano', 'vegetariano'],
    ['vegano', 'flexitariano'],
    ['vegetariano', 'vegetariano'],
    ['vegetariano', 'flexitariano'],
    ['flexitariano', 'flexitariano'],
  ] as const)(
    'UT-001 recipe %s is compatible with user %s',
    (recipeDiet, userDiet) => {
      expect(isDietCompatible(recipeDiet, userDiet)).toBe(true);
    },
  );

  it.each([
    ['flexitariano', 'vegano'],
    ['vegetariano', 'vegano'],
  ] as const)(
    'UT-002 recipe %s is not compatible with user %s (asymmetric hierarchy)',
    (recipeDiet, userDiet) => {
      expect(isDietCompatible(recipeDiet, userDiet)).toBe(false);
    },
  );
});

describe('allergyConflict', () => {
  it('UT-003 is true when the recipe and user allergen sets intersect', () => {
    const recipeAllergens = new Set(['leite', 'ovos']);
    const userAllergens = new Set(['ovos']);
    expect(hasAllergyConflict(recipeAllergens, userAllergens)).toBe(true);
  });

  it('UT-004 is false when there is no intersection', () => {
    const recipeAllergens = new Set(['leite']);
    const userAllergens = new Set(['amendoim']);
    expect(hasAllergyConflict(recipeAllergens, userAllergens)).toBe(false);
  });
});

describe('difficultyCompatible', () => {
  it('UT-005 is true only on an exact match', () => {
    expect(
      isDifficultyCompatible(
        CookingLevel.intermediario,
        CookingLevel.intermediario,
      ),
    ).toBe(true);
    expect(
      isDifficultyCompatible(CookingLevel.avancado, CookingLevel.intermediario),
    ).toBe(false);
    expect(isDifficultyCompatible(CookingLevel.iniciante, null)).toBe(false);
  });
});

describe('timeCompatible', () => {
  it.each([
    [CookingFrequency.quase_todo_dia, TimeBucket.ate_15, true],
    [CookingFrequency.quase_todo_dia, TimeBucket.quinze_30, true],
    [CookingFrequency.quase_todo_dia, TimeBucket.trinta_60, false],
    [CookingFrequency.quase_todo_dia, TimeBucket.sessenta_mais, false],
    [CookingFrequency.algumas_vezes_semana, TimeBucket.ate_15, true],
    [CookingFrequency.algumas_vezes_semana, TimeBucket.trinta_60, true],
    [CookingFrequency.algumas_vezes_semana, TimeBucket.sessenta_mais, false],
    [CookingFrequency.raramente, TimeBucket.ate_15, true],
    [CookingFrequency.raramente, TimeBucket.sessenta_mais, true],
  ] as const)(
    'UT-006 %s x %s -> %s',
    (cookingFrequency, timeBucket, expected) => {
      expect(isTimeCompatible(timeBucket, cookingFrequency)).toBe(expected);
    },
  );

  it('is false when the user has no cooking frequency set', () => {
    expect(isTimeCompatible(TimeBucket.ate_15, null)).toBe(false);
  });
});

describe('popularThisWeek', () => {
  it('UT-007 is true when the popularity value is at or above the top-N cutoff', () => {
    expect(isPopularThisWeek(120, 100)).toBe(true);
    expect(isPopularThisWeek(100, 100)).toBe(true);
    expect(isPopularThisWeek(99, 100)).toBe(false);
  });
});

describe('isRecent', () => {
  it('UT-008 is true at exactly the 14-day boundary and false at 15 days', () => {
    const exactlyFourteenDaysAgo = new Date(
      NOW.getTime() - RECENCY_WINDOW_DAYS * MS_PER_DAY,
    );
    const fifteenDaysAgo = new Date(NOW.getTime() - 15 * MS_PER_DAY);

    expect(isRecentRecipe(exactlyFourteenDaysAgo, NOW)).toBe(true);
    expect(isRecentRecipe(fifteenDaysAgo, NOW)).toBe(false);
  });

  it('is false when the recipe has no approvedAt', () => {
    expect(isRecentRecipe(null, NOW)).toBe(false);
  });
});

describe('categoryPerformsWell', () => {
  it('UT-009 is true at or above the median, false below it', () => {
    expect(categoryPerformsWell(50, 50)).toBe(true);
    expect(categoryPerformsWell(51, 50)).toBe(true);
    expect(categoryPerformsWell(49, 50)).toBe(false);
  });
});

describe('editorialBoostWeight', () => {
  it('UT-010 returns the weight of an active boost row', () => {
    const boost = {
      startsAt: new Date(NOW.getTime() - MS_PER_DAY),
      endsAt: new Date(NOW.getTime() + MS_PER_DAY),
      weight: 50,
    };
    expect(computeEditorialBoostWeight(boost, NOW)).toBe(50);
  });

  it('UT-011 returns 0 for an expired boost and 0 for a future boost', () => {
    const expired = {
      startsAt: new Date(NOW.getTime() - 10 * MS_PER_DAY),
      endsAt: new Date(NOW.getTime() - MS_PER_DAY),
      weight: 50,
    };
    const future = {
      startsAt: new Date(NOW.getTime() + MS_PER_DAY),
      endsAt: new Date(NOW.getTime() + 10 * MS_PER_DAY),
      weight: 50,
    };
    expect(computeEditorialBoostWeight(expired, NOW)).toBe(0);
    expect(computeEditorialBoostWeight(future, NOW)).toBe(0);
  });

  it('returns 0 when there is no boost row', () => {
    expect(computeEditorialBoostWeight(null, NOW)).toBe(0);
  });
});

describe('calculateTotalScore', () => {
  it('UT-012 sums every positive signal plus an active +5 boost to 115, with no allergy conflict applied', () => {
    const signals: ScoreSignals = {
      dietCompatible: true,
      allergyConflict: false,
      difficultyCompatible: true,
      timeCompatible: true,
      popularThisWeek: true,
      isRecent: true,
      categoryPerformsWell: true,
      editorialBoostWeight: 5,
    };

    expect(calculateTotalScore(signals)).toBe(115);
  });

  it('applies the -80 penalty when there is an allergy conflict', () => {
    const signals: ScoreSignals = {
      dietCompatible: true,
      allergyConflict: true,
      difficultyCompatible: false,
      timeCompatible: false,
      popularThisWeek: false,
      isRecent: false,
      categoryPerformsWell: false,
      editorialBoostWeight: 0,
    };

    expect(calculateTotalScore(signals)).toBe(40 - 80);
  });
});
