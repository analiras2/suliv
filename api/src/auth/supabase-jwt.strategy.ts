import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';

export interface SupabaseJwtPayload {
  sub: string;
  email: string;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      algorithms: ['RS256', 'ES256'],
      ignoreExpiration: false,
      issuer: configService.getOrThrow<string>('supabase.issuer'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600_000,
        jwksRequestsPerMinute: 5,
        jwksUri: configService.getOrThrow<string>('supabase.jwksUrl'),
        rateLimit: true,
      }),
    });
  }

  validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      return Promise.reject(
        new UnauthorizedException('Token is missing the subject claim'),
      );
    }

    return Promise.resolve({ id: payload.sub, email: payload.email });
  }
}
