import { Module } from '@nestjs/common';
import { RankingModule } from '../ranking/ranking.module';
import { RecipesService } from './recipes.service';

@Module({
  imports: [RankingModule],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
