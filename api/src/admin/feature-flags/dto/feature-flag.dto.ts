import { FeatureFlag } from '@prisma/client';

export class FeatureFlagDto {
  key!: string;
  enabled!: boolean;
  rolloutPercentage!: number | null;

  static fromFeatureFlag(flag: FeatureFlag): FeatureFlagDto {
    return {
      key: flag.key,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
    };
  }
}
