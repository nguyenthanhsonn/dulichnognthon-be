import { Controller, Get, Header, Inject } from '@nestjs/common';
import { RankingService } from '../services/ranking.service.js';

@Controller('rankings')
export class RankingController {
  constructor(
    @Inject(RankingService) private readonly rankings: RankingService,
  ) {}

  @Get('top')
  @Header('Cache-Control', 'no-store')
  top() {
    return this.rankings.list(true);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  list() {
    return this.rankings.list();
  }
}
