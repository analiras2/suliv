import { Module } from '@nestjs/common';
import { RankingModule } from '../ranking/ranking.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [RankingModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
