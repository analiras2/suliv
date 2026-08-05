import { UnauthorizedException } from '@nestjs/common';
import { hashSync } from 'bcrypt';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  const findUniqueAdmin = jest.fn();
  const prisma = { admin: { findUnique: findUniqueAdmin } };
  const configGet = jest.fn();
  const configGetOrThrow = jest.fn();
  const configService = { get: configGet, getOrThrow: configGetOrThrow };

  let service: AdminAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    configGetOrThrow.mockReturnValue('test-secret');
    configGet.mockReturnValue('12h');
    service = new AdminAuthService(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      configService as any,
    );
  });

  it('UT-001 login with correct credentials resolves { token, admin }', async () => {
    findUniqueAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash: hashSync('correct-password', 10),
      role: 'moderator',
    });

    const result = await service.login('admin@example.com', 'correct-password');

    expect(result.token).toEqual(expect.any(String));
    expect(result.admin).toEqual({
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'moderator',
    });
  });

  it('UT-002 login rejects a wrong password and a nonexistent email identically', async () => {
    findUniqueAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash: hashSync('correct-password', 10),
      role: 'moderator',
    });

    let wrongPasswordError: unknown;
    try {
      await service.login('admin@example.com', 'wrong-password');
    } catch (error) {
      wrongPasswordError = error;
    }

    findUniqueAdmin.mockResolvedValue(null);
    let nonexistentEmailError: unknown;
    try {
      await service.login('nobody@example.com', 'anything');
    } catch (error) {
      nonexistentEmailError = error;
    }

    expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
    expect(nonexistentEmailError).toBeInstanceOf(UnauthorizedException);
    expect((wrongPasswordError as UnauthorizedException).message).toBe(
      (nonexistentEmailError as UnauthorizedException).message,
    );
  });
});
