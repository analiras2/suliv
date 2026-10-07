import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlagsService } from './feature-flags.service';

const FLAG_KEY = 'new_feed';
const SAMPLE_SIZE = 10_000;
const ROLLOUT_PERCENTAGE = 30;
const TOLERANCE_PERCENTAGE_POINTS = 3;

function createService(flag: {
  enabled: boolean;
  rolloutPercentage: number | null;
}) {
  const prisma = {
    featureFlag: {
      findUnique: jest.fn().mockResolvedValue({ key: FLAG_KEY, ...flag }),
      findMany: jest.fn().mockResolvedValue([{ key: FLAG_KEY, ...flag }]),
    },
  };
  return new FeatureFlagsService(prisma as unknown as PrismaService);
}

describe('FeatureFlagsService', () => {
  // UT-007
  it('answers the same for the same user across repeated calls', async () => {
    const service = createService({ enabled: true, rolloutPercentage: 50 });

    const answers = await Promise.all(
      Array.from({ length: 5 }, () => service.isEnabled('user-1', FLAG_KEY)),
    );

    expect(new Set(answers).size).toBe(1);
  });

  // UT-008
  it('enables roughly the configured share of users', async () => {
    const service = createService({
      enabled: true,
      rolloutPercentage: ROLLOUT_PERCENTAGE,
    });

    let enabledCount = 0;
    for (let index = 0; index < SAMPLE_SIZE; index += 1) {
      if (await service.isEnabled(`user-${index}`, FLAG_KEY)) enabledCount += 1;
    }

    const share = (enabledCount / SAMPLE_SIZE) * 100;
    expect(Math.abs(share - ROLLOUT_PERCENTAGE)).toBeLessThan(
      TOLERANCE_PERCENTAGE_POINTS,
    );
  });

  // UT-009
  it('keeps a disabled flag off even at a 100% rollout', async () => {
    const service = createService({ enabled: false, rolloutPercentage: 100 });

    await expect(service.isEnabled('user-1', FLAG_KEY)).resolves.toBe(false);
  });

  it('enables everyone when the rollout percentage is null', async () => {
    const service = createService({ enabled: true, rolloutPercentage: null });

    await expect(service.isEnabled('user-1', FLAG_KEY)).resolves.toBe(true);
  });

  it('treats an unknown flag as disabled', async () => {
    const prisma = {
      featureFlag: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new FeatureFlagsService(prisma as unknown as PrismaService);

    await expect(service.isEnabled('user-1', 'missing')).resolves.toBe(false);
  });

  it('resolves every flag into a key to boolean map', async () => {
    const service = createService({ enabled: true, rolloutPercentage: null });

    await expect(service.resolveAll('user-1')).resolves.toEqual({
      [FLAG_KEY]: true,
    });
  });
});
