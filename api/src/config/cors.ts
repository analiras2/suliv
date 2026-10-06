import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const ORIGIN_SEPARATOR = ',';

/**
 * Only browser clients need CORS: the Expo web build calls the API straight from the page,
 * while the native apps don't enforce it and the admin panel proxies through its own server.
 * CORS stays off unless CORS_ORIGINS lists explicit origins, so a deployment that never sets
 * it keeps rejecting cross-origin browser calls exactly as before.
 */
export function buildCorsOptions(
  rawOrigins: string | undefined,
): CorsOptions | null {
  const origins = (rawOrigins ?? '')
    .split(ORIGIN_SEPARATOR)
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    return null;
  }

  return { origin: origins, credentials: false };
}
