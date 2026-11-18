import { ForbiddenException } from '@nestjs/common';

// Hết ngày 20/11/2026 tại Việt Nam (UTC+7), không phụ thuộc múi giờ server.
export const CONTEST_CLOSES_AT = Date.parse('2026-11-21T00:00:00+07:00');

export function isContestClosed(now: Date | number = Date.now()): boolean {
  return Number(now) >= CONTEST_CLOSES_AT;
}

export function assertContestOpen(now: Date | number = Date.now()): void {
  if (isContestClosed(now))
    throw new ForbiddenException(
      'Hội thi đã kết thúc. Cổng bình chọn và đăng nhập OTP đã đóng từ 00:00 ngày 21/11/2026 (giờ Việt Nam).',
    );
}
