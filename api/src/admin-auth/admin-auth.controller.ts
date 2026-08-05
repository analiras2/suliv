import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AdminAuthService, AdminLoginResult } from './admin-auth.service';
import { LoginDto } from './dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto): Promise<AdminLoginResult> {
    return this.adminAuthService.login(body.email, body.password);
  }
}
