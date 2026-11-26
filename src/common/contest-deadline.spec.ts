import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertContestOpen,
  CONTEST_CLOSES_AT,
  isContestClosed,
} from './contest-deadline.js';
import { AuthService } from '../services/auth.service.js';
import { getAuthSettings } from '../services/auth.config.js';
import { ConfigService } from '@nestjs/config';
import { VotesRepository } from '../database/votes.repository.js';
import { VotingService } from '../services/voting.service.js';
import type { RankingService } from '../services/ranking.service.js';

const settings = getAuthSettings(
  new ConfigService({
    AUTH_JWT_SECRET: 'test-only-jwt-secret-at-least-32-characters',
    AUTH_OTP_SECRET: 'test-only-otp-secret-at-least-32-characters',
  }),
);
afterEach(() => {
  vi.useRealTimers();
});

function authFixture(clock = new Date(CONTEST_CLOSES_AT)) {
  const tx = {
    query: vi.fn(async (sql: string) =>
      sql.includes('clock_timestamp') ? [{ now: clock }] : [],
    ),
    findOne: vi.fn(async () => null),
    findOneBy: vi.fn(async () => null),
    countBy: vi.fn(async () => 0),
    update: vi.fn(),
    create: vi.fn((_entity, value) => value),
    save: vi.fn(async (_entity, value) => value),
  };
  const transaction = vi.fn(
    async (_isolation: string, run: (tx: unknown) => unknown) => run(tx),
  );
  const mail = { assertAvailable: vi.fn(), sendOtp: vi.fn() };
  const auth = new AuthService(
    { transaction } as unknown as DataSource,
    new JwtService(),
    settings,
    mail,
  );
  return { auth, transaction, tx, mail };
}

it('reserves database capacity during OTP delivery and releases it after a failure', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(CONTEST_CLOSES_AT - 1000);
  const { auth, transaction, mail } = authFixture(
    new Date(CONTEST_CLOSES_AT - 1000),
  );
  let failDelivery!: (error: Error) => void;
  const busy = new Promise<void>((_resolve, reject) => {
    failDelivery = reject;
  });
  mail.sendOtp.mockReturnValue(busy);
  const deliveries = Array.from({ length: 8 }, (_, index) =>
    auth.sendOtp(`voter${index}@example.com`),
  );
  const settled = Promise.allSettled(deliveries);

  try {
    await expect(auth.resendOtp('next@example.com')).rejects.toMatchObject({
      status: 503,
    });
    expect(transaction).toHaveBeenCalledTimes(8);
  } finally {
    failDelivery(new Error('Gmail unavailable'));
    await settled;
  }

  mail.sendOtp.mockResolvedValue(undefined);
  await expect(auth.sendOtp('next@example.com')).resolves.toMatchObject({
    message: 'OTP đã được gửi.',
  });
  expect(transaction).toHaveBeenCalledTimes(9);
});

describe('contest closure at midnight Vietnam time', () => {
  it('caps a last-second OTP and its flow to the contest deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(CONTEST_CLOSES_AT - 1000);
    const { auth, mail, tx } = authFixture(new Date(CONTEST_CLOSES_AT - 1000));
    const result = await auth.sendOtp('voter@example.com');
    expect(mail.sendOtp).toHaveBeenCalledOnce();
    expect(result.expiresIn).toBe(1);
    expect(result.flowExpiresIn).toBe(1);
    expect(tx.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        expiresAt: new Date(CONTEST_CLOSES_AT),
        flowExpiresAt: new Date(CONTEST_CLOSES_AT),
      }),
    );
  });

  it('does not save a challenge when email delivery crosses the deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(CONTEST_CLOSES_AT - 1);
    const clock = new Date(CONTEST_CLOSES_AT - 1);
    const { auth, mail, tx } = authFixture(clock);
    mail.sendOtp.mockImplementation(async () => {
      clock.setTime(CONTEST_CLOSES_AT);
    });
    await expect(auth.sendOtp('voter@example.com')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tx.save).not.toHaveBeenCalled();
  });

  it('allows the last millisecond and rejects the exact cutoff and later', () => {
    expect(new Date(CONTEST_CLOSES_AT).toISOString()).toBe(
      '2026-11-20T17:00:00.000Z',
    );
    expect(isContestClosed(new Date('2026-11-20T23:59:59.999+07:00'))).toBe(
      false,
    );
    expect(() => assertContestOpen(CONTEST_CLOSES_AT - 1)).not.toThrow();
    expect(() => assertContestOpen(CONTEST_CLOSES_AT)).toThrow(
      ForbiddenException,
    );
    expect(() => assertContestOpen(CONTEST_CLOSES_AT + 1)).toThrow(
      ForbiddenException,
    );
  });

  it.each(['sendOtp', 'resendOtp', 'verifyOtp'] as const)(
    '%s rejects after closure before touching email or DB',
    async (method) => {
      vi.useFakeTimers();
      vi.setSystemTime(CONTEST_CLOSES_AT);
      const { auth, transaction, mail } = authFixture();
      const call =
        method === 'verifyOtp'
          ? auth.verifyOtp('voter@example.com', '123456')
          : auth[method]('voter@example.com');
      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      expect(transaction).not.toHaveBeenCalled();
      expect(mail.assertAvailable).not.toHaveBeenCalled();
      expect(mail.sendOtp).not.toHaveBeenCalled();
    },
  );

  it.each(['sendOtp', 'resendOtp', 'verifyOtp'] as const)(
    '%s rechecks the DB clock if waiting for a lock crosses the deadline',
    async (method) => {
      vi.useFakeTimers();
      vi.setSystemTime(CONTEST_CLOSES_AT - 1);
      const { auth, mail } = authFixture();
      const call =
        method === 'verifyOtp'
          ? auth.verifyOtp('voter@example.com', '123456')
          : auth[method]('voter@example.com');
      await expect(call).rejects.toBeInstanceOf(ForbiddenException);
      expect(mail.sendOtp).not.toHaveBeenCalled();
    },
  );

  it('blocks votes from an existing login after closure before writing', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(CONTEST_CLOSES_AT);
    const castVote = vi.fn();
    const service = new VotingService(
      {} as DataSource,
      { castVote } as unknown as VotesRepository,
      {} as RankingService,
    );
    await expect(
      service.castVote('existing-user', 'destination'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(castVote).not.toHaveBeenCalled();
  });

  it.each([
    [-1, true],
    [0, false],
    [1, false],
  ] as const)(
    'uses DB time at cutoff offset %d for the actual vote write',
    async (offset, accepted) => {
      const tx = {
        findOne: vi
          .fn()
          .mockResolvedValueOnce({ id: 'user', isBlocked: false })
          .mockResolvedValueOnce({ id: 'destination', isActive: true }),
        findOneBy: vi.fn(async () => null),
        query: vi.fn(async () => [
          { now: new Date(CONTEST_CLOSES_AT + offset) },
        ]),
        create: vi.fn((_entity, value) => value),
        save: vi.fn(async (_entity, value) => value),
        insert: vi.fn(),
      };
      const repository = new VotesRepository({
        transaction: async (
          _isolation: string,
          run: (tx: unknown) => unknown,
        ) => run(tx),
      } as unknown as DataSource);
      const result = await repository.castVote('user', 'destination');
      expect(result.accepted).toBe(accepted);
      expect(tx.save).toHaveBeenCalledTimes(accepted ? 1 : 0);
      if (!accepted) {
        expect(result).toEqual({ accepted: false, reason: 'VOTING_CLOSED' });
        expect(tx.insert).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            status: 'REJECTED',
            reason: 'VOTING_CLOSED',
          }),
        );
      }
    },
  );
});

describe('temporary voting reopening', () => {
  const reopenAt = Date.parse('2026-11-26T20:45:00+07:00');
  const closeAt = Date.parse('2026-11-26T21:20:00+07:00');

  it('remains open through the last millisecond before 21:20', () => {
    expect(isContestClosed(CONTEST_CLOSES_AT - 1)).toBe(false);
    expect(isContestClosed(CONTEST_CLOSES_AT)).toBe(true);
    expect(isContestClosed(reopenAt - 1)).toBe(true);
    expect(isContestClosed(reopenAt)).toBe(false);
    expect(isContestClosed(Date.parse('2026-11-26T21:00:00+07:00'))).toBe(false);
    expect(isContestClosed(closeAt - 1)).toBe(false);
    expect(isContestClosed(closeAt)).toBe(true);
  });

  it('allows OTP during reopening and caps its expiry at the new cutoff', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(closeAt - 1000);
    const { auth, tx } = authFixture(new Date(closeAt - 1000));
    await expect(auth.sendOtp('voter@example.com')).resolves.toMatchObject({
      expiresIn: 1,
      flowExpiresIn: 1,
    });
    expect(tx.save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ expiresAt: new Date(closeAt) }),
    );
    vi.setSystemTime(closeAt);
    await expect(auth.sendOtp('voter@example.com')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(auth.resendOtp('voter@example.com')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      auth.verifyOtp('voter@example.com', '123456'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(auth.refresh('existing-refresh-token')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
