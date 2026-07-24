import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AccountStatus, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAdminService } from './supabase-admin.service';
import { UsersService } from './users.service';

const NOW = new Date('2026-07-13T12:00:00.000Z');

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    name: null,
    username: 'ana_12345678',
    usernameUpdatedAt: null,
    avatarUrl: null,
    dietPreference: null,
    cookingLevel: null,
    cookingFrequency: null,
    onboardingCompletedAt: null,
    termsVersionAccepted: null,
    termsAcceptedAt: null,
    status: AccountStatus.active,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function uniqueUsernameError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    clientVersion: '6.19.3',
    code: 'P2002',
    meta: { target: ['username'] },
  });
}

describe('UsersService', () => {
  const upsertUser = jest.fn<Promise<User>, [Prisma.UserUpsertArgs]>();
  const updateUser = jest.fn<Promise<User>, [Prisma.UserUpdateArgs]>();
  const prisma = {
    $transaction: jest.fn(),
    allergen: { upsert: jest.fn() },
    analyticsEvent: { updateMany: jest.fn() },
    deviceToken: { deleteMany: jest.fn() },
    recipe: { deleteMany: jest.fn(), updateMany: jest.fn() },
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: updateUser,
      upsert: upsertUser,
    },
    userAllergy: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const supabaseAdmin = { deleteUser: jest.fn() };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(NOW);
    prisma.$transaction.mockImplementation(
      (
        operationsOrCallback:
          Promise<unknown>[] | ((tx: typeof prisma) => Promise<unknown>),
      ) =>
        typeof operationsOrCallback === 'function'
          ? operationsOrCallback(prisma)
          : Promise.all(operationsOrCallback),
    );
    service = new UsersService(
      prisma as unknown as PrismaService,
      supabaseAdmin as unknown as SupabaseAdminService,
    );
  });

  afterEach(() => jest.useRealTimers());

  it('UT-001 creates a user with a generated username and missingName', async () => {
    const created = userFixture();
    let upsertArgs: Prisma.UserUpsertArgs | undefined;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockImplementation((args) => {
      upsertArgs = args;
      return Promise.resolve(created);
    });

    await expect(
      service.bootstrap('user-1', 'ana@example.com'),
    ).resolves.toEqual({ user: created, missingName: true });
    expect(upsertArgs?.where).toEqual({ id: 'user-1' });
    expect(upsertArgs?.update).toEqual({});
    expect(upsertArgs?.create.id).toBe('user-1');
    expect(upsertArgs?.create.email).toBe('ana@example.com');
    expect(upsertArgs?.create.username).toMatch(/^ana_[a-f0-9]{8}$/);
  });

  it('UT-002 returns the existing bootstrap row unchanged', async () => {
    const existing = userFixture({ name: 'Ana' });
    prisma.user.findUnique.mockResolvedValue(existing);

    await expect(
      service.bootstrap('user-1', 'changed@example.com'),
    ).resolves.toEqual({ user: existing, missingName: false });
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });

  it('UT-003 stores a supplied name on first bootstrap', async () => {
    const created = userFixture({ name: 'Ana' });
    let upsertArgs: Prisma.UserUpsertArgs | undefined;
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockImplementation((args) => {
      upsertArgs = args;
      return Promise.resolve(created);
    });

    await expect(
      service.bootstrap('user-1', 'ana@example.com', 'Ana'),
    ).resolves.toEqual({ user: created, missingName: false });
    expect(upsertArgs?.create.name).toBe('Ana');
  });

  it('UT-004 returns email and null onboarding-owned fields', async () => {
    prisma.user.findUnique.mockResolvedValue(userFixture());

    await expect(service.getMe('user-1')).resolves.toEqual(
      expect.objectContaining({
        email: 'ana@example.com',
        dietPreference: null,
        cookingLevel: null,
        cookingFrequency: null,
        onboardingCompletedAt: null,
      }),
    );
  });

  it('UT-005 throws for an unknown user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getMe('unknown')).rejects.toThrow(NotFoundException);
  });

  it('UT-006 updates a valid username and its timestamp', async () => {
    const updated = userFixture({
      username: 'ana_cozinha',
      usernameUpdatedAt: NOW,
    });
    let updateArgs: Prisma.UserUpdateArgs | undefined;
    prisma.user.findUnique.mockResolvedValue(userFixture());
    prisma.user.update.mockImplementation((args) => {
      updateArgs = args;
      return Promise.resolve(updated);
    });

    await expect(
      service.updateMe('user-1', { username: 'ana_cozinha' }),
    ).resolves.toEqual(updated);
    expect(updateArgs?.data.usernameUpdatedAt).toEqual(NOW);
  });

  it('UT-007 maps a database username conflict to 409', async () => {
    prisma.user.findUnique.mockResolvedValue(userFixture());
    prisma.user.update.mockRejectedValue(uniqueUsernameError());

    await expect(
      service.updateMe('user-1', { username: 'existing_user' }),
    ).rejects.toThrow(ConflictException);
  });

  it('UT-008 rejects a username change during cooldown', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userFixture({
        usernameUpdatedAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000),
      }),
    );

    await expect(
      service.updateMe('user-1', { username: 'new_name' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('UT-009 permits a username change exactly 30 days later', async () => {
    const updated = userFixture({ username: 'new_name' });
    prisma.user.findUnique.mockResolvedValue(
      userFixture({
        usernameUpdatedAt: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000),
      }),
    );
    prisma.user.update.mockResolvedValue(updated);

    await expect(
      service.updateMe('user-1', { username: 'new_name' }),
    ).resolves.toEqual(updated);
  });

  it('UT-010 rejects an invalid username length or charset', async () => {
    prisma.user.findUnique.mockResolvedValue(userFixture());

    await expect(
      service.updateMe('user-1', { username: 'ab' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateMe('user-1', { username: 'invalid-name' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('UT-011 rejects a profane username', async () => {
    prisma.user.findUnique.mockResolvedValue(userFixture());
    await expect(
      service.updateMe('user-1', { username: 'puta.oficial' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('UT-012 records the accepted terms version and timestamp', async () => {
    const updated = userFixture({
      termsVersionAccepted: 'v2',
      termsAcceptedAt: NOW,
    });
    prisma.user.update.mockResolvedValue(updated);

    await expect(service.acceptTerms('user-1', 'v2')).resolves.toEqual(updated);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { termsAcceptedAt: NOW, termsVersionAccepted: 'v2' },
    });
  });

  it('UT-013 anonymizes personal data and clears related rows', async () => {
    let updateArgs: Prisma.UserUpdateArgs | undefined;
    prisma.user.findUnique.mockResolvedValue(userFixture({ name: 'Ana' }));
    prisma.user.update.mockImplementation((args) => {
      updateArgs = args;
      return Promise.resolve(userFixture());
    });
    prisma.userAllergy.deleteMany.mockResolvedValue({ count: 1 });
    prisma.deviceToken.deleteMany.mockResolvedValue({ count: 1 });
    prisma.analyticsEvent.updateMany.mockResolvedValue({ count: 1 });
    supabaseAdmin.deleteUser.mockResolvedValue(undefined);

    await service.deleteMe('user-1');

    const anonymizedData = updateArgs?.data;
    expect(anonymizedData?.avatarUrl).toBeNull();
    expect(anonymizedData?.email).toMatch(/@removed\.invalid$/);
    expect(anonymizedData?.name).toBeNull();
    expect(anonymizedData?.status).toBe('anonymized');
    expect(anonymizedData?.username).toMatch(/^removed_[a-f0-9]{12}$/);
    expect(prisma.userAllergy.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.analyticsEvent.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { userId: null },
    });
    expect(supabaseAdmin.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('UT-014 never deletes or reassigns authored recipes', async () => {
    prisma.user.findUnique.mockResolvedValue(userFixture());
    prisma.user.update.mockResolvedValue(userFixture());
    prisma.userAllergy.deleteMany.mockResolvedValue({ count: 0 });
    prisma.deviceToken.deleteMany.mockResolvedValue({ count: 0 });
    prisma.analyticsEvent.updateMany.mockResolvedValue({ count: 0 });
    supabaseAdmin.deleteUser.mockResolvedValue(undefined);

    await service.deleteMe('user-1');

    expect(prisma.recipe.deleteMany).not.toHaveBeenCalled();
    expect(prisma.recipe.updateMany).not.toHaveBeenCalled();
  });

  it('UT-015 throws a conflict after exhausting username retry attempts', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockRejectedValue(uniqueUsernameError());

    await expect(
      service.bootstrap('user-1', 'ana@example.com'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(5);
  });

  it('writes dietPreference/cookingLevel/cookingFrequency when provided to updateMe', async () => {
    const updated = userFixture({
      dietPreference: 'vegetariano',
      cookingLevel: 'intermediario',
      cookingFrequency: 'raramente',
    });
    let updateArgs: Prisma.UserUpdateArgs | undefined;
    prisma.user.findUnique.mockResolvedValue(userFixture());
    prisma.user.update.mockImplementation((args) => {
      updateArgs = args;
      return Promise.resolve(updated);
    });

    await expect(
      service.updateMe('user-1', {
        diet_preference: 'vegetariano',
        cooking_level: 'intermediario',
        cooking_frequency: 'raramente',
      }),
    ).resolves.toEqual(updated);
    expect(updateArgs?.data.dietPreference).toBe('vegetariano');
    expect(updateArgs?.data.cookingLevel).toBe('intermediario');
    expect(updateArgs?.data.cookingFrequency).toBe('raramente');
  });

  it('leaves diet/level/frequency untouched when omitted from updateMe payload', async () => {
    let updateArgs: Prisma.UserUpdateArgs | undefined;
    prisma.user.findUnique.mockResolvedValue(userFixture({ name: 'Ana' }));
    prisma.user.update.mockImplementation((args) => {
      updateArgs = args;
      return Promise.resolve(userFixture({ name: 'Novo Nome' }));
    });

    await service.updateMe('user-1', { name: 'Novo Nome' });

    expect(updateArgs?.data.dietPreference).toBeUndefined();
    expect(updateArgs?.data.cookingLevel).toBeUndefined();
    expect(updateArgs?.data.cookingFrequency).toBeUndefined();
  });

  it('replaces the full allergy set, removing rows not in the given ids', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue(userFixture());
    prisma.userAllergy.deleteMany.mockResolvedValue({ count: 2 });
    prisma.userAllergy.upsert.mockResolvedValue({});

    await service.updateAllergies('user-1', ['allergen-c']);

    expect(prisma.userAllergy.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', allergenId: { notIn: ['allergen-c'] } },
    });
    expect(prisma.userAllergy.upsert).toHaveBeenCalledWith({
      where: {
        userId_allergenId: { userId: 'user-1', allergenId: 'allergen-c' },
      },
      update: {},
      create: { userId: 'user-1', allergenId: 'allergen-c' },
    });
    expect(prisma.allergen.upsert).not.toHaveBeenCalled();
  });

  it('creates a pending Allergen row for a new term and links it to the user', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue(userFixture());
    prisma.userAllergy.deleteMany.mockResolvedValue({ count: 0 });
    prisma.userAllergy.upsert.mockResolvedValue({});
    prisma.allergen.upsert.mockResolvedValue({
      id: 'allergen-new',
      name: 'ingrediente-raro',
      status: 'pending',
    });

    await service.updateAllergies('user-1', [], 'ingrediente-raro');

    expect(prisma.allergen.upsert).toHaveBeenCalledWith({
      where: { name: 'ingrediente-raro' },
      update: {},
      create: { name: 'ingrediente-raro', status: 'pending' },
    });
    expect(prisma.userAllergy.upsert).toHaveBeenCalledWith({
      where: {
        userId_allergenId: { userId: 'user-1', allergenId: 'allergen-new' },
      },
      update: {},
      create: { userId: 'user-1', allergenId: 'allergen-new' },
    });
  });
});
