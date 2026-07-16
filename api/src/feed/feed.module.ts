import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RankingModule } from '../ranking/ranking.module';
import { RecipesModule } from '../recipes/recipes.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [AuthModule, RecipesModule, RankingModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
