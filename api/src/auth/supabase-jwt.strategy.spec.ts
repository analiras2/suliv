import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatusService } from './account-status.service';
import {
  SupabaseJwtPayload,
  SupabaseJwtStrategy,
} from './supabase-jwt.strategy';

describe('SupabaseJwtStrategy', () => {
  const isUsable = jest.fn();
  const strategy = new SupabaseJwtStrategy(
    new ConfigService({
      supabase: {
        issuer: 'https://project.supabase.co/auth/v1',
        jwksUrl: 'https://project.supabase.co/auth/v1/.well-known/jwks.json',
      },
    }),
    { isUsable } as unknown as AccountStatusService,
  );

  beforeEach(() => {
    isUsable.mockReset();
    isUsable.mockResolvedValue(true);
  });

  it('rejects a token whose account is no longer active', async () => {
    isUsable.mockResolvedValue(false);
    const payload: SupabaseJwtPayload = {
      sub: 'uuid-deleted',
      email: 'a@b.com',
      exp: Math.floor(Date.now() / 1000) + 300,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(isUsable).toHaveBeenCalledWith('uuid-deleted');
  });

  it('UT-015 returns the authenticated user for valid claims', async () => {
    const payload: SupabaseJwtPayload = {
      sub: 'uuid-123',
      email: 'a@b.com',
      exp: Math.floor(Date.now() / 1000) + 300,
    };

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 'uuid-123',
      email: 'a@b.com',
    });
  });

  it('UT-016 rejects a token without a subject claim', async () => {
    const payload = {
      email: 'a@b.com',
      exp: Math.floor(Date.now() / 1000) + 300,
    } as SupabaseJwtPayload;

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
