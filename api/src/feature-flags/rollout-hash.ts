const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const BUCKET_COUNT = 100;

/**
 * 32-bit FNV-1a: a fast, well-distributed, non-cryptographic hash. It only
 * buckets users deterministically; it is deliberately not keyed or secret.
 */
export function fnv1a(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (const byte of Buffer.from(input, 'utf8')) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** The user's stable 0-99 bucket for a flag. */
export function rolloutBucket(userId: string, flagKey: string): number {
  return fnv1a(`${userId}${flagKey}`) % BUCKET_COUNT;
}
