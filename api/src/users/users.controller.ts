import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import {
  AcceptTermsDto,
  BootstrapUserDto,
  UpdateUserDto,
  UserDto,
} from './dto';
import { BootstrapResult, UsersService } from './users.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('bootstrap')
  bootstrap(
    @Req() request: AuthenticatedRequest,
    @Body() body: BootstrapUserDto,
  ): Promise<BootstrapResult> {
    return this.usersService.bootstrap(
      request.user.id,
      request.user.email,
      body.name,
    );
  }

  @Get()
  getMe(@Req() request: AuthenticatedRequest): Promise<UserDto> {
    return this.usersService.getMe(request.user.id);
  }

  @Patch()
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.updateMe(request.user.id, body);
  }

  @Post('terms-acceptance')
  @HttpCode(HttpStatus.OK)
  async acceptTerms(
    @Req() request: AuthenticatedRequest,
    @Body() body: AcceptTermsDto,
  ): Promise<Pick<UserDto, 'termsVersionAccepted' | 'termsAcceptedAt'>> {
    const user = await this.usersService.acceptTerms(
      request.user.id,
      body.termsVersion,
    );
    return {
      termsVersionAccepted: user.termsVersionAccepted,
      termsAcceptedAt: user.termsAcceptedAt,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.ACCEPTED)
  async deleteMe(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.usersService.deleteMe(request.user.id);
  }
}
