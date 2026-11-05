import { Module } from '@nestjs/common';
import { RankingModule } from './ranking.module.js';
import { AuthModule } from './auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { VotingController } from '../controllers/voting.controller.js';
import { VotingService } from '../services/voting.service.js';

@Module({
  imports: [DatabaseModule, AuthModule, RankingModule],
  controllers: [VotingController],
  providers: [VotingService],
})
export class VotingModule {}
