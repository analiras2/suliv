import { analyticsClient, type AnalyticsEventPayloads } from '@/lib/analytics';

type UnmappedErrorPayload = AnalyticsEventPayloads['error_unmapped'];

const reportedKeys = new Set<string>();

/**
 * Tells the team a code or validation constraint has no pt-BR copy (ADR-007).
 * Each `code + source` pair is reported at most once per app session so a
 * failing query that re-renders cannot flood the analytics sink. The payload
 * carries no message text, URL parameters or user data.
 */
export function reportUnmappedError(payload: UnmappedErrorPayload): void {
  const key = `${payload.source}:${payload.code}`;
  if (reportedKeys.has(key)) return;
  reportedKeys.add(key);
  analyticsClient.track('error_unmapped', payload);
}

/** Test seam: forgets what was reported so each test starts a fresh session. */
export function resetUnmappedErrorReports(): void {
  reportedKeys.clear();
}
