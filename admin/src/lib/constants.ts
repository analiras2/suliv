export const SESSION_COOKIE_NAME = 'admin_session';

// ADR-003: queues poll every 30-60s instead of using push infrastructure.
export const QUEUE_REFETCH_INTERVAL_MS = 45_000;

export const ADMIN_API_URL = process.env.ADMIN_API_URL ?? 'http://localhost:3000';
