import { queueQueryDefaultOptions } from './query-client';

describe('queueQueryDefaultOptions', () => {
  it('sets a refetchInterval for queue-style queries', () => {
    expect(queueQueryDefaultOptions.queries?.refetchInterval).toBeGreaterThan(0);
  });

  it('refetches on window focus', () => {
    expect(queueQueryDefaultOptions.queries?.refetchOnWindowFocus).toBe(true);
  });
});
