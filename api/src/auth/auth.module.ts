import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OptionalAuthGuard } from './optional-auth.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [SupabaseJwtStrategy, SupabaseAuthGuard, OptionalAuthGuard],
  exports: [SupabaseAuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
