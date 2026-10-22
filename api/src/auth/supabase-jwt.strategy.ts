import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';
import { AccountStatusService } from './account-status.service';

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
  constructor(
    configService: ConfigService,
    private readonly accountStatus: AccountStatusService,
  ) {
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

  async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Token is missing the subject claim');
    }

    if (!(await this.accountStatus.isUsable(payload.sub))) {
      throw new UnauthorizedException('Account is no longer active');
    }

    return { id: payload.sub, email: payload.email };
  }
}
