import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, from, mergeMap } from 'rxjs';
import { AuthenticatedUser } from '../../auth/supabase-jwt.strategy';
import { ApiException } from '../../errors/api-exception';
import { RATE_LIMIT_METADATA, RateLimitMetadata } from './rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const metadata = this.reflector.get<RateLimitMetadata | undefined>(
      RATE_LIMIT_METADATA,
      context.getHandler(),
    );
    if (!metadata) return next.handle();

    const userId = context.switchToHttp().getRequest<AuthenticatedRequest>()
      .user?.id;
    if (!userId) {
      throw new ApiException('UNAUTHORIZED', 'Authentication required');
    }

    const { action, limit, window } = metadata;
    const allowed = await this.rateLimitService.isAllowed(
      userId,
      action,
      limit,
      window,
    );
    if (!allowed) {
      this.logger.warn(`rate limit reached action=${action} userId=${userId}`);
      throw new ApiException('RATE_LIMITED', 'Daily limit reached');
    }

    // The event is recorded only once the handler succeeded: a failing
    // handler (or a rejected call) never consumes the user's quota.
    return next
      .handle()
      .pipe(
        mergeMap((result: unknown) =>
          from(this.rateLimitService.record(userId, action).then(() => result)),
        ),
      );
  }
}
