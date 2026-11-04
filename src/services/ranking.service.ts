import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Destination, Vote } from '../database/entities/voting.entities.js';
import type { RankingResponseDto } from './dto/ranking/ranking.response.dto.js';

interface RankingRow {
  id: string;
  title: string;
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
export class RankingService {
  constructor(@Inject(DataSource) private readonly database: DataSource) {}

  async list(topOnly = false): Promise<RankingResponseDto> {
    // LEFT JOIN giữ cả điểm đến 0 phiếu. Một query GROUP BY, không truy vấn N+1.
    const query = this.database
      .getRepository(Destination)
      .createQueryBuilder('destination')
      .leftJoin(Vote, 'vote', 'vote.destinationId = destination.id')
      .where('destination.isActive = :active', { active: true })
      .select('destination.id', 'id')
      .addSelect('destination.title', 'title')
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
      // Window chạy trước LIMIT, nên tổng của /top vẫn là tổng toàn bộ điểm đến active.
      .addSelect('SUM(COUNT(vote.id)) OVER ()', 'totalVotes')
      .addSelect('COUNT(*) OVER ()', 'totalDestinations')
      .groupBy('destination.id')
      .orderBy('COUNT(vote.id)', 'DESC')
      .addOrderBy('destination.displayOrder', 'ASC')
      .addOrderBy('destination.id', 'ASC');
    if (topOnly) query.limit(3);
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
