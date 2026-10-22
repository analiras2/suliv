import { PrismaService } from '../prisma/prisma.service';
import {
  ACCOUNT_STATUS_CACHE_TTL_MS,
  AccountStatusService,
} from './account-status.service';

describe('AccountStatusService', () => {
  const findUnique = jest.fn();
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  let service: AccountStatusService;

  beforeEach(() => {
    jest.useFakeTimers();
    findUnique.mockReset();
    service = new AccountStatusService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats an active account as usable', async () => {
    findUnique.mockResolvedValue({ status: 'active' });

    await expect(service.isUsable('user-1')).resolves.toBe(true);
  });

  it('treats an anonymized account as unusable', async () => {
    findUnique.mockResolvedValue({ status: 'anonymized' });

    await expect(service.isUsable('user-1')).resolves.toBe(false);
  });

  it('allows a user without a local row yet (before bootstrap)', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.isUsable('user-1')).resolves.toBe(true);
  });

  it('serves repeated checks from the cache within the TTL', async () => {
    findUnique.mockResolvedValue({ status: 'active' });

    await service.isUsable('user-1');
    await service.isUsable('user-1');

    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('queries again after the TTL expires', async () => {
    findUnique.mockResolvedValue({ status: 'active' });
    await service.isUsable('user-1');

    jest.advanceTimersByTime(ACCOUNT_STATUS_CACHE_TTL_MS + 1);
    findUnique.mockResolvedValue({ status: 'anonymized' });

    await expect(service.isUsable('user-1')).resolves.toBe(false);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('queries again after the entry is invalidated', async () => {
    findUnique.mockResolvedValue({ status: 'active' });
    await service.isUsable('user-1');

    service.invalidate('user-1');
    findUnique.mockResolvedValue({ status: 'anonymized' });

    await expect(service.isUsable('user-1')).resolves.toBe(false);
  });
});
