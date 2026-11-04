import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '../src/database/database.config.js';
import {
  User,
  Destination,
  Vote,
  VoteAttempt,
  OtpCode,
  AuthSession,
} from '../src/database/entities/voting.entities.js';
import { VotesRepository } from '../src/database/votes.repository.js';

// Mọi dữ liệu test nằm trong schema UUID riêng, không ghi vào bảng public.
const schema = `test_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let dataSource: DataSource;
let votes: VotesRepository;
let schemaCreated = false;
const openSchedule = {
  VOTING_START_AT: '2000-01-01T00:00:00Z',
  VOTING_END_AT: '2999-01-01T00:00:00Z',
};

beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  await client.query(`SET search_path TO "${schema}"`);
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  const config = new ConfigService({
    DATABASE_URL: url.toString(),
    ...openSchedule,
  });
  dataSource = new DataSource(createDatabaseOptions(url.toString()));
  await dataSource.initialize();
  await dataSource.runMigrations();
  votes = new VotesRepository(dataSource, config);
});

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
  // Chỉ xóa schema do chính test này tạo; không reset database dùng chung.
  if (schemaCreated) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

async function fixtures(count = 1, blocked = false, active = true) {
  const user = await dataSource.getRepository(User).save({
    email: `voter-${randomUUID()}@example.com`,
    isBlocked: blocked,
  });
  const destinations = await Promise.all(
    Array.from({ length: count }, () =>
      dataSource.getRepository(Destination).save({
        title: 'Điểm đến thử nghiệm',
        slug: randomUUID(),
        brief: 'Mô tả',
        detail: '# Chi tiết',
        isActive: active,
      }),
    ),
  );
  return { user, destinations };
}

it('creates exactly seven tables and stores Vietnamese table comments', async () => {
  const { rows } = await client.query(
    "SELECT tablename, obj_description((quote_ident(schemaname) || '.' || quote_ident(tablename))::regclass) AS comment FROM pg_tables WHERE schemaname = $1 AND tablename <> 'typeorm_migrations'",
    [schema],
  );
  expect(rows).toHaveLength(7);
  expect(rows.every((row) => Boolean(row.comment))).toBe(true);
});

it('allows exactly three concurrent votes and persists all audit outcomes', async () => {
  const { user, destinations } = await fixtures(8);
  const results = await Promise.all(
    destinations.map((destination) => votes.castVote(user.id, destination.id)),
  );
  expect(results.filter((result) => result.accepted)).toHaveLength(3);
  expect(
    results.filter(
      (result) => !result.accepted && result.reason === 'VOTE_LIMIT_REACHED',
    ),
  ).toHaveLength(5);
  expect(
    await dataSource.getRepository(Vote).count({ where: { userId: user.id } }),
  ).toBe(3);
  expect(
    await dataSource
      .getRepository(VoteAttempt)
      .count({ where: { userId: user.id } }),
  ).toBe(8);
});

it('serializes duplicate submissions without losing the rejection audit', async () => {
  const {
    user,
    destinations: [destination],
  } = await fixtures();
  const results = await Promise.all([
    votes.castVote(user.id, destination.id),
    votes.castVote(user.id, destination.id),
  ]);
  expect(results.filter((result) => result.accepted)).toHaveLength(1);
  expect(results).toContainEqual({ accepted: false, reason: 'ALREADY_VOTED' });
  expect(
    await dataSource
      .getRepository(VoteAttempt)
      .count({ where: { userId: user.id } }),
  ).toBe(2);
});

it.each([
  [true, true, 'USER_BLOCKED'],
  [false, false, 'DESTINATION_INACTIVE'],
] as const)(
  'rejects blocked/inactive records (%s, %s)',
  async (blocked, active, reason) => {
    const {
      user,
      destinations: [destination],
    } = await fixtures(1, blocked, active);
    expect(await votes.castVote(user.id, destination.id)).toEqual({
      accepted: false,
      reason,
    });
    expect(
      await dataSource
        .getRepository(Vote)
        .count({ where: { userId: user.id } }),
    ).toBe(0);
  },
);

it('closes voting with no schedule and after the deadline', async () => {
  const {
    user,
    destinations: [destination],
  } = await fixtures();
  for (const config of [
    {},
    {
      VOTING_START_AT: '2000-01-01T00:00:00Z',
      VOTING_END_AT: '2001-01-01T00:00:00Z',
    },
  ]) {
    const closed = new VotesRepository(dataSource, new ConfigService(config));
    expect(await closed.castVote(user.id, destination.id)).toEqual({
      accepted: false,
      reason: 'VOTING_CLOSED',
    });
  }
});

it('prevents changing/deleting votes and rejects invalid media types', async () => {
  const {
    user,
    destinations: [destination],
  } = await fixtures();
  const outcome = await votes.castVote(user.id, destination.id);
  if (!outcome.accepted) throw new Error('Expected accepted vote');
  await expect(
    dataSource.getRepository(Vote).delete(outcome.vote.id),
  ).rejects.toThrow();
  await expect(
    dataSource
      .getRepository(Vote)
      .update(outcome.vote.id, { createdAt: new Date() }),
  ).rejects.toThrow();
  await expect(
    client.query(
      'INSERT INTO destination_media (destination_id, media_type, media_url) VALUES ($1, $2, $3)',
      [destination.id, 'AUDIO', 'https://example.com/test'],
    ),
  ).rejects.toThrow();
  expect(
    await dataSource.getRepository(Vote).countBy({ userId: user.id }),
  ).toBe(1);
});

it('stores OTP/session hashes and enforces foreign keys and nonnegative attempts', async () => {
  const { user } = await fixtures();
  const expiresAt = new Date(Date.now() + 300000);
  const otp = await dataSource.getRepository(OtpCode).save({
    userId: user.id,
    email: user.email,
    codeHash: 'test-hash',
    expiresAt,
  });
  expect(otp.attemptCount).toBe(0);
  const session = await dataSource
    .getRepository(AuthSession)
    .save({ userId: user.id, refreshTokenHash: 'test-token-hash', expiresAt });
  expect(session.revokedAt).toBeNull();
  await expect(
    dataSource.getRepository(OtpCode).update(otp.id, { attemptCount: -1 }),
  ).rejects.toThrow();
  await expect(
    dataSource
      .getRepository(AuthSession)
      .save({ userId: randomUUID(), refreshTokenHash: 'hash', expiresAt }),
  ).rejects.toThrow();
});

it('does not rerun an applied migration', async () => {
  expect(await dataSource.runMigrations()).toEqual([]);
});
