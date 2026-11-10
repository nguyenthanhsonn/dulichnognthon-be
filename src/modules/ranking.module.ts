import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { RankingStreamCompressionMiddleware } from '../common/middleware/ranking-stream-compression.middleware.js';
import { DatabaseModule } from '../database/database.module.js';
import { RankingController } from '../controllers/ranking.controller.js';
import { RankingService } from '../services/ranking.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RankingStreamCompressionMiddleware).forRoutes({
      path: 'rankings/stream',
      method: RequestMethod.GET,
    });
  }
}
