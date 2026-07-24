import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { RecipesModule } from '../recipes/recipes.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [AuthModule, FavoritesModule, RecipesModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
