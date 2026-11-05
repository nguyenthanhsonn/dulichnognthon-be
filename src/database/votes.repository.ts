import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  User,
  Destination,
  Vote,
  VoteAttempt,
} from './entities/voting.entities.js';

type Rejection =
  | 'USER_NOT_FOUND'
  | 'USER_BLOCKED'
  | 'DESTINATION_NOT_FOUND'
  | 'DESTINATION_INACTIVE'
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
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

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

        // FE quản lý lịch mở/đóng; backend ghi thời điểm thực sau khi nhận khóa.
        const [clock] = await tx.query<{ now: Date }[]>(
          'SELECT clock_timestamp() AS now',
        );
        const existing = await tx.findOneBy(Vote, { userId, destinationId });
        if (existing) return reject('ALREADY_VOTED');

        const vote = await tx.save(
          Vote,
          // Ghi thời điểm thực thay vì thời điểm bắt đầu transaction trước khi chờ khóa.
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
