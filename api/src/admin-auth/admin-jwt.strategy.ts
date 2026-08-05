import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AdminRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AdminJwtPayload {
  sub: string;
  role: AdminRole;
  exp: number;
}

export interface AuthenticatedAdmin {
  id: string;
  role: AdminRole;
}

// Registered under a distinct strategy name so AdminAuthGuard never collides
// with or accepts tokens meant for SupabaseAuthGuard's `AuthGuard('jwt')`.
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      algorithms: ['HS256'],
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('adminAuth.jwtSecret'),
    });
  }

  validate(payload: AdminJwtPayload): Promise<AuthenticatedAdmin> {
    if (!payload.sub) {
      return Promise.reject(
        new UnauthorizedException('Token is missing the subject claim'),
      );
    }

    return Promise.resolve({ id: payload.sub, role: payload.role });
  }
}
