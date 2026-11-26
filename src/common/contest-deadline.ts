import { ForbiddenException } from '@nestjs/common';

// Hết ngày 20/11/2026 tại Việt Nam (UTC+7), không phụ thuộc múi giờ server.
export const CONTEST_CLOSES_AT = Date.parse('2026-11-21T00:00:00+07:00');
export const SCHEDULED_REOPENING = {
  startsAt: Date.parse('2026-11-26T21:55:47+07:00'),
  endsAt: Date.parse('2026-11-26T22:20:00+07:00'),
};

export function contestClosesAt(now: Date | number): number {
  if (Number(now) < CONTEST_CLOSES_AT) return CONTEST_CLOSES_AT;
  return Number(now) >= SCHEDULED_REOPENING.startsAt
    ? SCHEDULED_REOPENING.endsAt
    : CONTEST_CLOSES_AT;
}

export function isContestClosed(now: Date | number = Date.now()): boolean {
  return Number(now) >= contestClosesAt(now);
}

export const CONTEST_CLOSED_MESSAGE =
  'Cổng bình chọn và đăng nhập OTP hiện đã đóng.';

export function assertContestOpen(now: Date | number = Date.now()): void {
  if (isContestClosed(now))
    throw new ForbiddenException(CONTEST_CLOSED_MESSAGE);
}
