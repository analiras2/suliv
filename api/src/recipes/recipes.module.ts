import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RankingModule } from '../ranking/ranking.module';
import { MyRecipesController } from './my-recipes.controller';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [RankingModule, AuthModule],
  controllers: [RecipesController, MyRecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
