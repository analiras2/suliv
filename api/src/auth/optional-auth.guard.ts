import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from './supabase-jwt.strategy';

/**
 * Used by `GET /recipes/:slug`, the app's one route that reads the JWT when
 * present but never requires it (ADR-002). Unlike `SupabaseAuthGuard`, a
 * missing or invalid token resolves to an anonymous request instead of a
 * 401 — `AuthGuard('jwt')`'s default `handleRequest` is the only piece that
 * throws on a missing user, so overriding it is sufficient.
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser | undefined>(
    _err: unknown,
    user: AuthenticatedUser | false,
  ): TUser {
    return (user || undefined) as TUser;
  }
}
