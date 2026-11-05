import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { RankingController } from '../controllers/ranking.controller.js';
import { RankingService } from '../services/ranking.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
