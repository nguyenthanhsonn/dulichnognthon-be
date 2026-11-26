import { ForbiddenException } from '@nestjs/common';

// Hết ngày 20/11/2026 tại Việt Nam (UTC+7), không phụ thuộc múi giờ server.
export const CONTEST_CLOSES_AT = Date.parse('2026-11-21T00:00:00+07:00');
const REOPEN_DURATION_MS = 15 * 60 * 1000;
const SCHEDULED_REOPENING = {
  startsAt: Date.parse('2026-11-26T20:30:00+07:00'),
  endsAt: Date.parse('2026-11-26T20:55:00+07:00'),
};

export function configuredVotingReopening(): {
  startsAt: number;
  endsAt: number;
} {
  const value = process.env.VOTING_REOPEN_AT?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    return SCHEDULED_REOPENING;
  const startsAt = Date.parse(value);
  if (!(startsAt >= SCHEDULED_REOPENING.endsAt)) return SCHEDULED_REOPENING;
  return { startsAt, endsAt: startsAt + REOPEN_DURATION_MS };
}

export function contestClosesAt(now: Date | number): number {
  if (Number(now) < CONTEST_CLOSES_AT) return CONTEST_CLOSES_AT;
  const reopening = configuredVotingReopening();
  return Number(now) >= reopening.startsAt
    ? reopening.endsAt
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
