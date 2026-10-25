import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const ACCOUNT_STATUS_CACHE_TTL_MS = 30_000;

interface CachedStatus {
  isUsable: boolean;
  expiresAt: number;
}

/**
 * Tells whether a JWT subject may still use the API. A JWT stays valid until
 * it expires even after the account is deleted, so the strategy asks this
 * service on every request. Results are cached briefly to keep the extra
 * query off the hot path; `invalidate` drops an entry right after a deletion.
 *
 * A user with no local row is usable: the row is created by `POST /users/bootstrap`
 * right after sign-up, which itself needs an authenticated request.
 */
@Injectable()
export class AccountStatusService {
  private readonly cache = new Map<string, CachedStatus>();

  constructor(private readonly prisma: PrismaService) {}

  async isUsable(userId: string): Promise<boolean> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.isUsable;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    const isUsable = !user || user.status === 'active';

    this.cache.set(userId, {
      isUsable,
      expiresAt: Date.now() + ACCOUNT_STATUS_CACHE_TTL_MS,
    });
    return isUsable;
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}
