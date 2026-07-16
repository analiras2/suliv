import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto, UpdateUserDto, UserDto } from './dto';
import { SupabaseAdminService } from './supabase-admin.service';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;
const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_USERNAME_ATTEMPTS = 5;
const PROFANE_TERMS = new Set([
  'bitch',
  'caralho',
  'cuzao',
  'fuck',
  'merda',
  'porra',
  'puta',
  'putaria',
  'shit',
]);

export interface BootstrapResult {
  user: UserDto;
  missingName: boolean;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async bootstrap(
    authUserId: string,
    email: string,
    name?: string,
  ): Promise<BootstrapResult> {
    const existing = await this.prisma.user.findUnique({
      where: { id: authUserId },
    });
    if (existing) {
      this.logBootstrap(authUserId, false);
      return this.toBootstrapResult(existing);
    }

    for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt += 1) {
      try {
        const user = await this.prisma.user.upsert({
          where: { id: authUserId },
          update: {},
          create: {
            id: authUserId,
            email,
            name,
            username: this.generateUsername(email),
          },
        });
        this.logBootstrap(authUserId, true);
        return this.toBootstrapResult(user);
      } catch (error: unknown) {
        if (!this.isUniqueConflict(error, 'username')) {
          throw error;
        }
      }
    }

    throw new ConflictException('Unable to generate a unique username');
  }

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserDto.fromUser(user);
  }

  async updateMe(userId: string, data: UpdateUserDto): Promise<UserDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const usernameChanged =
      data.username !== undefined && data.username !== currentUser.username;
    if (usernameChanged) {
      this.validateUsername(data.username!);
      this.enforceUsernameCooldown(currentUser.usernameUpdatedAt);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          username: data.username,
          usernameUpdatedAt: usernameChanged ? new Date() : undefined,
        },
      });
      return UserDto.fromUser(user);
    } catch (error: unknown) {
      if (this.isUniqueConflict(error, 'username')) {
        throw new ConflictException('Username is already taken');
      }
      throw error;
    }
  }

  async acceptTerms(userId: string, termsVersion: string): Promise<UserDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          termsAcceptedAt: new Date(),
          termsVersionAccepted: termsVersion,
        },
      });
      return UserDto.fromUser(user);
    } catch (error: unknown) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async completeOnboarding(
    userId: string,
    data: OnboardingDto,
  ): Promise<UserDto> {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            dietPreference: data.diet_preference,
            cookingLevel: data.cooking_level,
            cookingFrequency: data.cooking_frequency,
            onboardingCompletedAt: new Date(),
          },
        });

        for (const allergenId of data.allergen_ids) {
          await tx.userAllergy.upsert({
            where: { userId_allergenId: { userId, allergenId } },
            update: {},
            create: { userId, allergenId },
          });
        }

        for (const term of data.new_terms) {
          const allergen = await tx.allergen.upsert({
            where: { name: term },
            update: {},
            create: { name: term, status: 'pending' },
          });
          await tx.userAllergy.upsert({
            where: { userId_allergenId: { userId, allergenId: allergen.id } },
            update: {},
            create: { userId, allergenId: allergen.id },
          });
        }

        return updatedUser;
      });
      return UserDto.fromUser(user);
    } catch (error: unknown) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async deleteMe(userId: string): Promise<void> {
    await this.getMe(userId);
    const hash = createHash('sha256').update(userId).digest('hex').slice(0, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: null,
          email: `${hash}@removed.invalid`,
          name: null,
          status: 'anonymized',
          username: `removed_${hash}`,
        },
      }),
      this.prisma.userAllergy.deleteMany({ where: { userId } }),
      this.prisma.deviceToken.deleteMany({ where: { userId } }),
      this.prisma.analyticsEvent.updateMany({
        where: { userId },
        data: { userId: null },
      }),
    ]);

    await this.supabaseAdmin.deleteUser(userId);
    this.logger.log({ userId }, 'UserDeleted');
  }

  private enforceUsernameCooldown(usernameUpdatedAt: Date | null): void {
    if (
      usernameUpdatedAt &&
      Date.now() - usernameUpdatedAt.getTime() < USERNAME_COOLDOWN_MS
    ) {
      throw new UnprocessableEntityException(
        'Username can only be changed every 30 days',
      );
    }
  }

  private generateUsername(email: string): string {
    const base = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_.]/g, '')
      .slice(0, 11);
    const safeBase = base.length >= 3 ? base : 'user';
    const suffix = randomUUID().replaceAll('-', '').slice(0, 8);
    return `${safeBase}_${suffix}`;
  }

  private isRecordNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  private isUniqueConflict(error: unknown, field: string): boolean {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }
    const target = error.meta?.target;
    return Array.isArray(target)
      ? target.includes(field)
      : String(target).includes(field);
  }

  private logBootstrap(userId: string, wasNewUser: boolean): void {
    this.logger.log({ userId, wasNewUser }, 'UserBootstrap');
  }

  private toBootstrapResult(user: User): BootstrapResult {
    return { user: UserDto.fromUser(user), missingName: user.name === null };
  }

  private validateUsername(username: string): void {
    if (!USERNAME_PATTERN.test(username)) {
      throw new BadRequestException(
        'Username must be 3-20 characters using letters, numbers, _ or .',
      );
    }
    const terms = username.toLowerCase().split(/[_.]+/);
    if (terms.some((term) => PROFANE_TERMS.has(term))) {
      throw new BadRequestException('Username contains prohibited language');
    }
  }
}
