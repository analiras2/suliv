import { Module } from '@nestjs/common';
import { PopularityService } from './popularity.service';
import { RankingService } from './ranking.service';

@Module({
  providers: [RankingService, PopularityService],
  exports: [RankingService, PopularityService],
})
export class RankingModule {}
