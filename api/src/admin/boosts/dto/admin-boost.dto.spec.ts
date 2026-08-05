import { computeBoostStatus } from './admin-boost.dto';

describe('computeBoostStatus', () => {
  const now = new Date('2026-06-15T00:00:00Z');

  it('UT-015 returns upcoming for a future-dated boost', () => {
    const status = computeBoostStatus(
      {
        startsAt: new Date('2026-06-20T00:00:00Z'),
        endsAt: new Date('2026-06-30T00:00:00Z'),
      },
      now,
    );
    expect(status).toBe('upcoming');
  });

  it('UT-015 returns active for a boost within its date range', () => {
    const status = computeBoostStatus(
      {
        startsAt: new Date('2026-06-01T00:00:00Z'),
        endsAt: new Date('2026-06-30T00:00:00Z'),
      },
      now,
    );
    expect(status).toBe('active');
  });

  it('UT-015 returns expired for a past boost', () => {
    const status = computeBoostStatus(
      {
        startsAt: new Date('2026-05-01T00:00:00Z'),
        endsAt: new Date('2026-05-10T00:00:00Z'),
      },
      now,
    );
    expect(status).toBe('expired');
  });
});
