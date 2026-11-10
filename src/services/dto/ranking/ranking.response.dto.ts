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

/** Absolute counts, not increments: reconnects/coalesced updates cannot lose votes. */
export class RankingCountsResponseDto {
  totalVotes: number;
  totalDestinations: number;
  items: { id: string; voteCount: number; rank: number }[];
}
