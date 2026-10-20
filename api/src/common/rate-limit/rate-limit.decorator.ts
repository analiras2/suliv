import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitWindow } from './rate-limit.service';

export const RATE_LIMIT_METADATA = 'rate_limit';

export interface RateLimitMetadata {
  action: string;
  limit: number;
  window: RateLimitWindow;
}

/**
 * Limits how many times a user may succeed at `action` per window, e.g.
 * `@RateLimit('recipe_submit', 5, 'day')`. Use it behind an auth guard and
 * import `RateLimitModule` in the host module.
 */
export function RateLimit(
  action: string,
  limit: number,
  window: RateLimitWindow,
): MethodDecorator {
  const metadata: RateLimitMetadata = { action, limit, window };
  return applyDecorators(
    SetMetadata(RATE_LIMIT_METADATA, metadata),
    UseInterceptors(RateLimitInterceptor),
  );
}
