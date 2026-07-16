import { DietPreference } from '@prisma/client';

export const DIET_COMPATIBILITY: Record<DietPreference, DietPreference[]> = {
  [DietPreference.vegano]: [DietPreference.vegano],
  [DietPreference.vegetariano]: [
    DietPreference.vegano,
    DietPreference.vegetariano,
  ],
  [DietPreference.flexitariano]: [
    DietPreference.vegano,
    DietPreference.vegetariano,
    DietPreference.flexitariano,
  ],
};

export function isDietCompatible(
  recipeDiet: DietPreference,
  userDiet: DietPreference,
): boolean {
  return DIET_COMPATIBILITY[userDiet].includes(recipeDiet);
}
