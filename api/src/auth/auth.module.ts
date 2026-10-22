import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccountStatusService } from './account-status.service';
import { OptionalAuthGuard } from './optional-auth.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    AccountStatusService,
    SupabaseJwtStrategy,
    SupabaseAuthGuard,
    OptionalAuthGuard,
  ],
  exports: [AccountStatusService, SupabaseAuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
