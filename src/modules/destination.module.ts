import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DestinationController } from '../controllers/destination.controller.js';
import { DestinationService } from '../services/destination.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DestinationController],
  providers: [DestinationService],
})
export class DestinationModule {}
