import { DestinationSummaryDto } from '../destination/destination.response.dto.js';

export class RankingItemDto extends DestinationSummaryDto {
  rank: number;
  voteCount: number;
}

export class RankingResponseDto {
  items: RankingItemDto[];
  totalVotes: number;
  totalDestinations: number;
}
