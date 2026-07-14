import { AccountStatus, User } from '@prisma/client';

export class UserDto {
  id!: string;
  email!: string;
  name!: string | null;
  username!: string;
  usernameUpdatedAt!: Date | null;
  avatarUrl!: string | null;
  dietPreference!: User['dietPreference'];
  cookingLevel!: User['cookingLevel'];
  cookingFrequency!: User['cookingFrequency'];
  onboardingCompletedAt!: Date | null;
  termsVersionAccepted!: string | null;
  termsAcceptedAt!: Date | null;
  status!: AccountStatus;
  createdAt!: Date;
  updatedAt!: Date;

  static fromUser(user: User): UserDto {
    return { ...user };
  }
}
