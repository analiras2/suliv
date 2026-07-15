import { afterEach, describe, expect, it, jest } from '@jest/globals';

const mockGetString = jest.fn<(key: string) => string | undefined>();
const mockSet = jest.fn<(key: string, value: string) => void>();
const mockDelete = jest.fn<(key: string) => void>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: (key: string) => mockGetString(key),
    set: (key: string, value: string) => mockSet(key, value),
    delete: (key: string) => mockDelete(key),
  })),
}));

// eslint-disable-next-line import/first
import { offlineCache } from './offline-cache';

describe('offlineCache', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // UT-001
  it('round-trips a value through set and get', () => {
    let stored: string | undefined;
    mockSet.mockImplementation((_key: string, value: string) => { stored = value; });
    mockGetString.mockImplementation(() => stored);

    offlineCache.set('k', { a: 1 });

    expect(mockSet).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }));
    expect(offlineCache.get('k')).toEqual({ a: 1 });
  });

  // UT-002
  it('returns null for a missing key', () => {
    mockGetString.mockReturnValue(undefined);
    expect(offlineCache.get('missing-key')).toBeNull();
  });

  // UT-003
  it('returns null when the underlying read throws (corrupted value)', () => {
    mockGetString.mockImplementation(() => { throw new Error('corrupted native read'); });
    expect(() => offlineCache.get('k')).not.toThrow();
    expect(offlineCache.get('k')).toBeNull();
  });

  it('returns null when the stored value is not valid JSON', () => {
    mockGetString.mockReturnValue('{not-json');
    expect(offlineCache.get('k')).toBeNull();
  });

  it('removes a key via the underlying storage', () => {
    offlineCache.remove('k');
    expect(mockDelete).toHaveBeenCalledWith('k');
  });
});
