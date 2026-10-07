import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rolloutBucket } from './rollout-hash';

interface FlagState {
  key: string;
  enabled: boolean;
  rolloutPercentage: number | null;
}

/**
 * Resolves feature flags per user. The rollout bucket is recomputed from
 * `(userId, flagKey)` on every call, so nothing is persisted and a user's
 * answer is stable while the percentage only grows.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(userId: string, flagKey: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: flagKey },
    });
    return flag ? this.resolve(userId, flag) : false;
  }

  async resolveAll(userId: string): Promise<Record<string, boolean>> {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return Object.fromEntries(
      flags.map((flag) => [flag.key, this.resolve(userId, flag)]),
    );
  }

  private resolve(userId: string, flag: FlagState): boolean {
    // `enabled: false` is the kill switch, whatever the percentage says.
    if (!flag.enabled) return false;
    if (flag.rolloutPercentage === null) return true;
    return rolloutBucket(userId, flag.key) < flag.rolloutPercentage;
  }
}
