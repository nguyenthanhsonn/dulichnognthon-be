import type { DestinationSummaryDto } from '../destination/destination.response.dto.js';

export class VoteResponseDto {
  id: string;
  destinationId: string;
  createdAt: string;
}

export class MyVoteDto extends VoteResponseDto {
  destination: DestinationSummaryDto;
}

export class MyVotesResponseDto {
  items: MyVoteDto[];
  usedVotes: number;
  /** Không có hạn mức tổng cho tài khoản. */
  remainingVotes: null;
  maxVotes: null;
}
