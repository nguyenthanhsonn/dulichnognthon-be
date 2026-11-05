import {
  Inject,
  Injectable,
  Logger,
  type MessageEvent,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  EMPTY,
  Subject,
  auditTime,
  catchError,
  defer,
  distinctUntilChanged,
  exhaustMap,
  map,
  merge,
  shareReplay,
  takeUntil,
  timer,
  type Observable,
} from 'rxjs';
import { DataSource } from 'typeorm';
import { Destination, Vote } from '../database/entities/voting.entities.js';
import type { RankingResponseDto } from './dto/ranking/ranking.response.dto.js';

interface RankingRow {
  id: string;
  title: string;
  contestCode: string | null;
  shortTitle: string;
  slug: string;
  brief: string;
  province: string | null;
  thumbnailUrl: string | null;
  displayOrder: number;
  voteCount: string;
  rank: string;
  totalVotes: string;
  totalDestinations: string;
}

@Injectable()
export class RankingService implements OnModuleDestroy {
  private readonly logger = new Logger(RankingService.name);
  private readonly changes = new Subject<void>();
  private readonly stopped = new Subject<void>();
  private generation = 0;
  private cache?: { value: RankingResponseDto; expiresAt: number };
  private pending?: {
    generation: number;
    promise: Promise<RankingResponseDto>;
  };

  // Một luồng dùng chung cho mọi kết nối; không chạy polling khi không có người xem.
  // Query định kỳ đồng bộ cả phiếu được ghi từ instance khác hoặc trực tiếp vào DB.
  private readonly events: Observable<MessageEvent> = merge(
    timer(0, 2000),
    this.changes,
  ).pipe(
    auditTime(25),
    exhaustMap(() =>
      defer(() => this.list()).pipe(
        catchError((error: unknown) => {
          this.logger.warn(
            `Ranking refresh failed: ${error instanceof Error ? error.name : 'unknown error'}`,
          );
          return EMPTY;
        }),
      ),
    ),
    distinctUntilChanged(
      (previous, current) =>
        JSON.stringify(previous) === JSON.stringify(current),
    ),
    map((data): MessageEvent => ({ type: 'rankings', data, retry: 3000 })),
    takeUntil(this.stopped),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  constructor(@Inject(DataSource) private readonly database: DataSource) {}

  /** Gọi sau khi transaction vote đã commit; lần đọc sau luôn lấy snapshot mới. */
  invalidate(): void {
    this.generation++;
    this.cache = undefined;
    this.changes.next();
  }

  stream(): Observable<MessageEvent> {
    // Heartbeat không ghi đè snapshot replay; người mới luôn nhận bảng hiện tại.
    return merge(
      this.events,
      timer(15000, 15000).pipe(
        map((): MessageEvent => ({ comment: 'keep-alive' })),
      ),
    ).pipe(takeUntil(this.stopped));
  }

  onModuleDestroy(): void {
    this.stopped.next();
    this.stopped.complete();
    this.changes.complete();
    this.cache = undefined;
  }

  async list(topOnly = false): Promise<RankingResponseDto> {
    const value = await this.snapshot();
    // /top dùng cùng truy vấn với bảng đầy đủ, tổng vẫn tính trên mọi bài active.
    return structuredClone({
      totalVotes: value.totalVotes,
      totalDestinations: value.totalDestinations,
      items: topOnly ? value.items.slice(0, 3) : value.items,
    });
  }

  private async snapshot(canRetry = true): Promise<RankingResponseDto> {
    if (this.cache && this.cache.expiresAt > Date.now())
      return this.cache.value;
    const generation = this.generation;
    if (!this.pending) {
      const promise = this.query()
        .then((value) => {
          if (this.generation === generation)
            this.cache = { value, expiresAt: Date.now() + 1000 };
          return value;
        })
        .finally(() => {
          if (this.pending?.promise === promise) this.pending = undefined;
        });
      this.pending = { generation, promise };
    }
    const pending = this.pending;
    const value = await pending.promise;
    // Thử lấy snapshot mới một lần nếu vote commit trong lúc đọc. Không lặp vô hạn
    // khi phiếu đến liên tục; không cache kết quả cũ, tick sau tiếp tục đồng bộ.
    return pending.generation !== this.generation && canRetry
      ? this.snapshot(false)
      : value;
  }

  private async query(): Promise<RankingResponseDto> {
    // LEFT JOIN giữ cả điểm đến 0 phiếu. Một query GROUP BY, không truy vấn N+1.
    const query = this.database
      .getRepository(Destination)
      .createQueryBuilder('destination')
      .leftJoin(Vote, 'vote', 'vote.destinationId = destination.id')
      .where('destination.isActive = :active', { active: true })
      .select('destination.id', 'id')
      .addSelect('destination.title', 'title')
      .addSelect('destination.contestCode', 'contestCode')
      .addSelect(
        'COALESCE(destination.shortTitle, destination.title)',
        'shortTitle',
      )
      .addSelect('destination.slug', 'slug')
      .addSelect('destination.brief', 'brief')
      .addSelect('destination.province', 'province')
      .addSelect('destination.thumbnailUrl', 'thumbnailUrl')
      .addSelect('destination.displayOrder', 'displayOrder')
      .addSelect('COUNT(vote.id)', 'voteCount')
      .addSelect(
        'ROW_NUMBER() OVER (ORDER BY COUNT(vote.id) DESC, destination.displayOrder ASC, destination.id ASC)',
        'rank',
      )
      // Tính tổng toàn bộ điểm đến active trước khi list(topOnly) cắt Top 3.
      .addSelect('SUM(COUNT(vote.id)) OVER ()', 'totalVotes')
      .addSelect('COUNT(*) OVER ()', 'totalDestinations')
      .groupBy('destination.id')
      .orderBy('COUNT(vote.id)', 'DESC')
      .addOrderBy('destination.displayOrder', 'ASC')
      .addOrderBy('destination.id', 'ASC');
    const rows = await query.getRawMany<RankingRow>();
    return {
      items: rows.map(
        ({ totalVotes: _votes, totalDestinations: _destinations, ...row }) => ({
          ...row,
          voteCount: Number(row.voteCount),
          rank: Number(row.rank),
        }),
      ),
      totalVotes: Number(rows[0]?.totalVotes ?? 0),
      totalDestinations: Number(rows[0]?.totalDestinations ?? 0),
    };
  }
}
