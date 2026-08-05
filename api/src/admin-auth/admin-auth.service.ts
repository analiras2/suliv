import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcrypt';
import { sign, SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { AdminDto } from './dto';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export interface AdminLoginResult {
  token: string;
  admin: AdminDto;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AdminLoginResult> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    // Same generic error whether the email doesn't exist or the password is
    // wrong — never lets a caller distinguish the two (avoids email
    // enumeration).
    const passwordMatches = admin
      ? await compare(password, admin.passwordHash)
      : false;
    if (!admin || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const signOptions: SignOptions = {
      algorithm: 'HS256',
      expiresIn: this.configService.get<SignOptions['expiresIn']>(
        'adminAuth.jwtExpiresIn',
        '12h',
      ),
    };
    const token = sign(
      { sub: admin.id, role: admin.role },
      this.configService.getOrThrow<string>('adminAuth.jwtSecret'),
      signOptions,
    );

    return { token, admin: AdminDto.fromAdmin(admin) };
  }
}
