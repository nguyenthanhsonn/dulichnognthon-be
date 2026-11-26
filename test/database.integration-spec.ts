import 'dotenv/config';
import { randomUUID } from 'node:crypto';
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
import { RankingService } from '../src/services/ranking.service.js';

// Mọi dữ liệu test nằm trong schema UUID riêng, không ghi vào bảng public.
const schema = `test_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let dataSource: DataSource;
let votes: VotesRepository;
let schemaCreated = false;
beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  await client.query(`SET search_path TO "${schema}"`);
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  dataSource = new DataSource(createDatabaseOptions(url.toString()));
  await dataSource.initialize();
  await dataSource.runMigrations();
  votes = new VotesRepository(dataSource);
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

it('creates the application tables and stores Vietnamese table comments', async () => {
  const { rows } = await client.query(
    "SELECT tablename, obj_description((quote_ident(schemaname) || '.' || quote_ident(tablename))::regclass) AS comment FROM pg_tables WHERE schemaname = $1 AND tablename <> 'typeorm_migrations'",
    [schema],
  );
  expect(rows).toHaveLength(9);
  expect(rows.every((row) => Boolean(row.comment))).toBe(true);
});

it('uses one Gmail mailbox per destination even for concurrent legacy aliases', async () => {
  const local = randomUUID().replaceAll('-', '');
  const users = await dataSource
    .getRepository(User)
    .save([
      { email: local + '@gmail.com' },
      {
        email:
          local.slice(0, 3) + '.' + local.slice(3) + '+alias@googlemail.com',
      },
    ]);
  const {
    destinations: [first, second],
  } = await fixtures(2);
  const results = await Promise.all(
    users.map((user) => votes.castVote(user.id, first.id)),
  );
  expect(results.filter((result) => result.accepted)).toHaveLength(1);
  expect(results).toContainEqual({ accepted: false, reason: 'ALREADY_VOTED' });
  expect(await votes.castVote(users[1].id, second.id)).toMatchObject({
    accepted: true,
  });
});

it('rejects an existing disposable account before writing a vote', async () => {
  const user = await dataSource
    .getRepository(User)
    .save({ email: randomUUID() + '@sub.anonmart.com' });
  const {
    destinations: [destination],
  } = await fixtures();
  expect(await votes.castVote(user.id, destination.id)).toEqual({
    accepted: false,
    reason: 'USER_BLOCKED',
  });
  expect(
    await dataSource.getRepository(Vote).countBy({ userId: user.id }),
  ).toBe(0);
});

it('keeps destinations with zero eligible votes and restores only after the last exclusion is lifted', async () => {
  const {
    user,
    destinations: [destination],
  } = await fixtures();
  const result = await votes.castVote(user.id, destination.id);
  if (!result.accepted)
    throw new Error('Expected the test vote to be accepted.');
  const ranking = new RankingService(dataSource);
  try {
    await dataSource.query(
      `INSERT INTO vote_disqualifications (vote_id, reason, cutoff_at, disqualified_by)
      VALUES ($1, 'UNAPPROVED_DOMAIN', now(), 'BTC'), ($1, 'DUPLICATE_GMAIL_SAME_DESTINATION', now(), 'BTC')`,
      [result.vote.id],
    );
    const score = async () => {
      ranking.invalidate();
      return (await ranking.list()).items.find(
        (item) => item.id === destination.id,
      )?.voteCount;
    };
    expect(await score()).toBe(0);
    for (const reason of [
      'UNAPPROVED_DOMAIN',
      'DUPLICATE_GMAIL_SAME_DESTINATION',
    ]) {
      await dataSource.query(
        `UPDATE vote_disqualifications SET restored_at = now(), restored_by = 'BTC', restoration_note = 'Phúc khảo'
        WHERE vote_id = $1 AND reason = $2`,
        [result.vote.id, reason],
      );
      expect(await score()).toBe(reason === 'UNAPPROVED_DOMAIN' ? 0 : 1);
    }
    expect(
      await dataSource.getRepository(Vote).countBy({ id: result.vote.id }),
    ).toBe(1);
  } finally {
    ranking.onModuleDestroy();
  }
});

it('publishes database results across rankings and keeps the original votes', async () => {
  const { user, destinations } = await fixtures(3);
  const [first, second, third] = destinations;
  await votes.castVote(user.id, first.id);
  await votes.castVote(user.id, second.id);
  await votes.castVote(user.id, third.id);
  await dataSource.query(
    `INSERT INTO published_vote_results (destination_id, vote_count, source)
     VALUES ($1, 0, 'Test workbook'), ($2, 10, 'Test workbook')`,
    [first.id, second.id],
  );

  const ranking = new RankingService(dataSource);
  try {
    const full = await ranking.list();
    const scores = new Map(full.items.map((item) => [item.id, item.voteCount]));
    expect(scores.get(first.id)).toBe(0);
    expect(scores.get(second.id)).toBe(10);
    expect(scores.get(third.id)).toBe(1);
    expect(full.items[0]).toMatchObject({ id: second.id, rank: 1 });
    expect(full.totalVotes).toBe(
      full.items.reduce((total, item) => total + item.voteCount, 0),
    );
    expect(await ranking.list(true)).toEqual({
      totalVotes: full.totalVotes,
      totalDestinations: full.totalDestinations,
      items: full.items.slice(0, 3),
    });
    expect(await ranking.counts()).toMatchObject({
      totalVotes: full.totalVotes,
      items: full.items.map(({ id, voteCount, rank }) => ({
        id,
        voteCount,
        rank,
      })),
    });
    expect(
      await dataSource.getRepository(Vote).countBy({ userId: user.id }),
    ).toBe(3);
  } finally {
    ranking.onModuleDestroy();
  }
});

it('allows eight distinct concurrent votes and persists every successful audit', async () => {
  const { user, destinations } = await fixtures(8);
  const results = await Promise.all(
    destinations.map((destination) => votes.castVote(user.id, destination.id)),
  );
  expect(results.filter((result) => result.accepted)).toHaveLength(8);
  expect(
    await dataSource.getRepository(Vote).count({ where: { userId: user.id } }),
  ).toBe(8);
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

it('accepts voting without backend schedule configuration', async () => {
  const {
    user,
    destinations: [destination],
  } = await fixtures();
  expect(await votes.castVote(user.id, destination.id)).toMatchObject({
    accepted: true,
  });
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
