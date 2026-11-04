import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  User,
  Destination,
  Vote,
  VoteAttempt,
} from './entities/voting.entities.js';
import { getVotingSettings } from './voting.config.js';

type Rejection =
  | 'USER_NOT_FOUND'
  | 'USER_BLOCKED'
  | 'DESTINATION_NOT_FOUND'
  | 'DESTINATION_INACTIVE'
  | 'VOTING_CLOSED'
  | 'ALREADY_VOTED';

export type VoteOutcome =
  { accepted: true; vote: Vote } | { accepted: false; reason: Rejection };

export interface VoteContext {
  // Caller phải truyền hash đã tính ở backend, không truyền IP/device thô.
  ipHash?: string;
  deviceHash?: string;
}

/** Điểm ghi vote dùng chung; lớp xác thực phải lấy userId từ phiên đã xác thực. */
@Injectable()
export class VotesRepository {
  private readonly settings: ReturnType<typeof getVotingSettings>;

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(ConfigService) config: ConfigService,
  ) {
    this.settings = getVotingSettings(config);
  }

  async castVote(
    userId: string,
    destinationId: string,
    context: VoteContext = {},
  ): Promise<VoteOutcome> {
    const auditContext = {
      ipHash: context.ipHash,
      deviceHash: context.deviceHash,
    };
    return this.dataSource.transaction(
      'READ COMMITTED',
      async (tx): Promise<VoteOutcome> => {
        // Tuần tự hóa request của cùng user để chống bình chọn trùng đồng thời.
        // READ COMMITTED lấy snapshot mới ở câu SELECT kế tiếp sau khi chờ khóa.
        const user = await tx.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });
        // Khóa chia sẻ giữ trạng thái active ổn định trong lúc tạo vote.
        const destination = await tx.findOne(Destination, {
          where: { id: destinationId },
          lock: { mode: 'pessimistic_read' },
        });
        const reject = async (reason: Rejection): Promise<VoteOutcome> => {
          await tx.insert(VoteAttempt, {
            userId: user?.id ?? null,
            destinationId: destination?.id ?? null,
            ...auditContext,
            status: 'REJECTED',
            reason,
          });
          // Trả kết quả thay vì throw trong transaction để nhật ký không bị rollback.
          return { accepted: false, reason };
        };

        if (!user) return reject('USER_NOT_FOUND');
        if (user.isBlocked) return reject('USER_BLOCKED');
        if (!destination) return reject('DESTINATION_NOT_FOUND');
        if (!destination.isActive) return reject('DESTINATION_INACTIVE');

        // Dùng đồng hồ DB sau khi đã nhận khóa, tránh request chờ quá giờ đóng.
        const [clock] = await tx.query<{ now: Date }[]>(
          'SELECT clock_timestamp() AS now',
        );
        const { startsAt, endsAt } = this.settings;
        if (
          !startsAt ||
          !endsAt ||
          clock.now < startsAt ||
          clock.now > endsAt
        ) {
          return reject('VOTING_CLOSED');
        }
        const existing = await tx.findOneBy(Vote, { userId, destinationId });
        if (existing) return reject('ALREADY_VOTED');

        const vote = await tx.save(
          Vote,
          // CURRENT_TIMESTAMP mặc định là lúc bắt đầu transaction, có thể trước
          // giờ mở khi request phải chờ khóa; ghi đúng thời điểm đã kiểm tra.
          tx.create(Vote, { userId, destinationId, createdAt: clock.now }),
        );
        // Vote và audit thành công luôn commit hoặc rollback cùng nhau.
        await tx.insert(VoteAttempt, {
          userId,
          destinationId,
          ...auditContext,
          status: 'SUCCESS',
        });
        return { accepted: true, vote };
      },
    );
  }
}
