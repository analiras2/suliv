import { EditorialBoost } from '@prisma/client';

export type BoostStatus = 'upcoming' | 'active' | 'expired';

export class AdminBoostDto {
  id!: string;
  recipeId!: string;
  weight!: number;
  startsAt!: Date;
  endsAt!: Date;
  status!: BoostStatus;

  static fromBoost(boost: EditorialBoost, now: Date): AdminBoostDto {
    return {
      id: boost.id,
      recipeId: boost.recipeId,
      weight: boost.weight,
      startsAt: boost.startsAt,
      endsAt: boost.endsAt,
      status: computeBoostStatus(boost, now),
    };
  }
}

export function computeBoostStatus(
  boost: Pick<EditorialBoost, 'startsAt' | 'endsAt'>,
  now: Date,
): BoostStatus {
  if (now < boost.startsAt) {
    return 'upcoming';
  }
  if (now > boost.endsAt) {
    return 'expired';
  }
  return 'active';
}
