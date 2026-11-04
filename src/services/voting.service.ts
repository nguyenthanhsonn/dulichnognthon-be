import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Vote } from '../database/entities/voting.entities.js';
import { VotesRepository } from '../database/votes.repository.js';
import { getVotingSettings } from '../database/voting.config.js';
import { destinationSummary } from './dto/destination/destination.response.dto.js';
import type {
  MyVotesResponseDto,
  VoteResponseDto,
} from './dto/voting/vote.response.dto.js';

@Injectable()
export class VotingService {
  private readonly maxVotes: number;
  constructor(
    @Inject(DataSource) private readonly database: DataSource,
    @Inject(VotesRepository) private readonly votes: VotesRepository,
    @Inject(ConfigService) config: ConfigService,
  ) {
    this.maxVotes = getVotingSettings(config).maxVotesPerUser;
  }

  async castVote(
    userId: string,
    destinationId: string,
  ): Promise<VoteResponseDto> {
    // Không tự đếm rồi INSERT ở service: repository giữ khóa user trong toàn bộ transaction.
    const outcome = await this.votes.castVote(userId, destinationId);
    if (!outcome.accepted) {
      switch (outcome.reason) {
        case 'USER_NOT_FOUND':
          throw new UnauthorizedException('Tài khoản không còn tồn tại.');
        case 'USER_BLOCKED':
          throw new ForbiddenException('Tài khoản đã bị chặn.');
        case 'DESTINATION_NOT_FOUND':
          throw new NotFoundException('Không tìm thấy điểm đến.');
        case 'DESTINATION_INACTIVE':
          throw new BadRequestException('Điểm đến không nhận bình chọn.');
        case 'VOTING_CLOSED':
          throw new ForbiddenException('Bình chọn chưa mở hoặc đã kết thúc.');
        case 'ALREADY_VOTED':
          throw new ConflictException('Bạn đã bình chọn cho điểm đến này.');
        case 'VOTE_LIMIT_REACHED':
          throw new ConflictException(
            `Bạn đã dùng hết ${this.maxVotes} lượt bình chọn.`,
          );
      }
    }
    return {
      id: outcome.vote.id,
      destinationId: outcome.vote.destinationId,
      createdAt: outcome.vote.createdAt.toISOString(),
    };
  }

  async mine(userId: string): Promise<MyVotesResponseDto> {
    // Vẫn tính phiếu đã dùng nếu điểm đến sau đó bị ẩn; không hoàn lại lượt bình chọn.
    const votes = await this.database.getRepository(Vote).find({
      where: { userId },
      relations: { destination: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return {
      items: votes.map((vote) => ({
        id: vote.id,
        destinationId: vote.destinationId,
        createdAt: vote.createdAt.toISOString(),
        destination: destinationSummary(vote.destination),
      })),
      usedVotes: votes.length,
      remainingVotes: Math.max(0, this.maxVotes - votes.length),
      maxVotes: this.maxVotes,
    };
  }
}
