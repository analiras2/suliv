import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [SupabaseJwtStrategy, SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
