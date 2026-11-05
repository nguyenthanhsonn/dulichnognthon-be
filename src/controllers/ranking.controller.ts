import { Controller, Get, Header, Inject, Sse } from '@nestjs/common';
import { RankingService } from '../services/ranking.service.js';

@Controller('rankings')
export class RankingController {
  constructor(
    @Inject(RankingService) private readonly rankings: RankingService,
  ) {}

  // Dữ liệu công khai, không dùng cookie/token; cho phép EventSource từ frontend khác origin.
  @Sse('stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('X-Accel-Buffering', 'no')
  @Header('Access-Control-Allow-Origin', '*')
  stream() {
    return this.rankings.stream();
  }

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
