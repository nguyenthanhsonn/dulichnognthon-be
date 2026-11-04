import type { ConfigService } from '@nestjs/config';

export function getVotingSettings(config: ConfigService) {
  const integer = (key: string, fallback: number, maximum: number): number => {
    const raw = config.get<string>(key);
    const value = raw === undefined || raw === '' ? fallback : Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > maximum) {
      throw new Error(`${key} must be an integer between 1 and ${maximum}.`);
    }
    return value;
  };
  const date = (key: string): Date | null => {
    const value = config.get<string>(key);
    if (!value) return null;
    // Bắt buộc timezone để giờ hội thi không phụ thuộc timezone của server.
    const timestamp =
      /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
        value,
      );
    if (
      !timestamp ||
      !Number.isFinite(Date.parse(value)) ||
      // Date.parse có thể tự đổi 30/02 sang tháng 3; không chấp nhận lịch sai.
      new Date(`${timestamp[1]}T00:00:00Z`).toISOString().slice(0, 10) !==
        timestamp[1]
    ) {
      throw new Error(`${key} must be an ISO date with an explicit timezone.`);
    }
    return new Date(value);
  };
  const startsAt = date('VOTING_START_AT');
  const endsAt = date('VOTING_END_AT');
  if (
    Boolean(startsAt) !== Boolean(endsAt) ||
    (startsAt && endsAt && startsAt >= endsAt)
  ) {
    throw new Error(
      'Set both VOTING_START_AT and VOTING_END_AT, with start before end.',
    );
  }

  return {
    // Thiếu lịch chính thức nghĩa là hội thi chưa mở, không tự áp dụng lịch đề xuất.
    startsAt,
    endsAt,
    maxVotesPerUser: integer('MAX_VOTES_PER_USER', 3, 3),
    otpExpiresSeconds: integer('OTP_EXPIRES_SECONDS', 300, 300),
    otpMaxAttempts: integer('OTP_MAX_ATTEMPTS', 3, 3),
  };
}
