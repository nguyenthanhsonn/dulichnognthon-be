import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { Global, type INestApplication, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import pg from 'pg';
import request from 'supertest';
import { DestinationModule } from '../src/modules/destination.module.js';
import { VotingModule } from '../src/modules/voting.module.js';
import { RankingModule } from '../src/modules/ranking.module.js';
import { DatabaseModule } from '../src/database/database.module.js';
import { createDatabaseOptions } from '../src/database/database.config.js';
import {
  User,
  AuthSession,
  Destination,
  DestinationMedia,
  Vote,
} from '../src/database/entities/voting.entities.js';
import { VotesRepository } from '../src/database/votes.repository.js';
import { seedDestinations } from '../src/database/seeds/destinations.seed.js';
import { AUTH_SETTINGS, getAuthSettings } from '../src/services/auth.config.js';
import { EMAIL_SENDER } from '../src/services/email/email-sender.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

// Dùng schema riêng và token/session test; không gọi login hoặc gửi email.
const schema = `test_comp_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let database: DataSource;
let app: INestApplication;
let schemaCreated = false;
const open = {
  VOTING_START_AT: '2000-01-01T00:00:00+07:00',
  VOTING_END_AT: '2999-01-01T00:00:00+07:00',
};
const authSettings = getAuthSettings(
  new ConfigService({
    AUTH_JWT_SECRET: 'competition-test-only-jwt-secret-at-least-32-chars',
    AUTH_OTP_SECRET: 'competition-test-only-otp-secret-at-least-32-chars',
  }),
);
const mail = {
  assertAvailable: () => {},
  sendOtp: vi.fn(async () => {
    throw new Error('Competition APIs must not send email');
  }),
};

async function createApp(schedule: Record<string, string> = open) {
  const config = new ConfigService({ ...schedule, MAX_VOTES_PER_USER: '3' });
  @Global()
  @Module({
    providers: [
      { provide: DataSource, useValue: database },
      { provide: ConfigService, useValue: config },
      VotesRepository,
    ],
    exports: [DataSource, ConfigService, VotesRepository],
  })
  class TestDatabaseModule {}
  const module = await Test.createTestingModule({
    imports: [DestinationModule, VotingModule, RankingModule],
    providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  })
    .overrideModule(DatabaseModule)
    .useModule(TestDatabaseModule)
    .overrideProvider(AUTH_SETTINGS)
    .useValue(authSettings)
    .overrideProvider(EMAIL_SENDER)
    .useValue(mail)
    .compile();
  const application = module.createNestApplication();
  await application.init();
  return application;
}

beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  database = new DataSource(createDatabaseOptions(url.toString()));
  await database.initialize();
  await database.runMigrations();
});
beforeEach(async () => {
  // Cô lập bảng xếp hạng giữa các test, giữ phiếu cũ bất biến trong schema test.
  await database
    .getRepository(Destination)
    .createQueryBuilder()
    .update()
    .set({ isActive: false })
    .execute();
  app = await createApp();
});
afterEach(async () => {
  await app?.close();
});
afterAll(async () => {
  if (database?.isInitialized) await database.destroy();
  if (schemaCreated) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

const destination = (values: Partial<Destination> = {}) =>
  database.getRepository(Destination).save({
    title: 'Alpha Farm',
    slug: randomUUID(),
    brief: 'Làng quê xanh',
    detail: '# Chi tiết Markdown',
    province: 'Tỉnh thử nghiệm',
    displayOrder: 1,
    isActive: true,
    ...values,
  });
const user = () =>
  database
    .getRepository(User)
    .save({ email: `voter-${randomUUID()}@example.com` });
async function authenticatedUser() {
  const account = await user();
  const session = await database.getRepository(AuthSession).save({
    userId: account.id,
    refreshTokenHash: 'a'.repeat(64),
    expiresAt: new Date(Date.now() + 86400000),
  });
  const token = await new JwtService().signAsync(
    { sub: account.id, sid: session.id, type: 'access' },
    {
      secret: authSettings.jwtSecret,
      issuer: authSettings.issuer,
      audience: authSettings.audience,
      algorithm: 'HS256',
      expiresIn: 900,
    },
  );
  return { account, token };
}
const postVote = (token: string, id: string) =>
  request(app.getHttpServer())
    .post('/votes')
    .set('Authorization', `Bearer ${token}`)
    .send({ destinationId: id });

it('returns empty rankings and totals when there are no active destinations', async () => {
  for (const path of ['/rankings', '/rankings/top']) {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    expect(response.body).toEqual({
      items: [],
      totalVotes: 0,
      totalDestinations: 0,
    });
    expect(response.headers['cache-control']).toBe('no-store');
  }
});

it('lists only active destinations with stable pagination and case-insensitive literal search', async () => {
  const first = await destination({ title: 'ALPHA Farm', displayOrder: 1 });
  const second = await destination({ title: 'Beta Village', displayOrder: 2 });
  await destination({ title: 'Hidden ALPHA', isActive: false });
  const page = await request(app.getHttpServer())
    .get('/destinations?page=2&limit=1')
    .expect(200);
  expect(page.body).toMatchObject({
    total: 2,
    totalPages: 2,
    page: 2,
    limit: 1,
  });
  expect(page.body.items.map((item: Destination) => item.id)).toEqual([
    second.id,
  ]);
  const search = await request(app.getHttpServer())
    .get('/destinations')
    .query({ keyword: 'alpha' })
    .expect(200);
  expect(search.body.items.map((item: Destination) => item.id)).toEqual([
    first.id,
  ]);
  const wildcard = await request(app.getHttpServer())
    .get('/destinations')
    .query({ keyword: '%' })
    .expect(200);
  expect(wildcard.body.total).toBe(0);
});

it('returns detail with images and videos in stable display order', async () => {
  const item = await destination();
  const media = [
    {
      id: '00000000-0000-4000-8000-000000000003',
      mediaType: 'IMAGE' as const,
      displayOrder: 2,
    },
    {
      id: '00000000-0000-4000-8000-000000000001',
      mediaType: 'VIDEO' as const,
      displayOrder: 1,
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      mediaType: 'IMAGE' as const,
      displayOrder: 2,
    },
  ];
  await database.getRepository(DestinationMedia).insert(
    media.map((value) => ({
      ...value,
      destinationId: item.id,
      mediaUrl: 'https://example.com/test-media',
      caption: 'Demo media',
    })),
  );
  const response = await request(app.getHttpServer())
    .get(`/destinations/${item.slug}`)
    .expect(200);
  expect(response.body.detail).toBe(item.detail);
  expect(response.body.media.map((value: { id: string }) => value.id)).toEqual([
    media[1].id,
    media[2].id,
    media[0].id,
  ]);
  expect(response.body.media[0].mediaType).toBe('VIDEO');
});

it('hides inactive details, validates pagination and exposes no CRUD endpoints', async () => {
  const hidden = await destination({ isActive: false });
  await request(app.getHttpServer())
    .get(`/destinations/${hidden.slug}`)
    .expect(404);
  await request(app.getHttpServer()).get('/destinations/missing').expect(404);
  for (const query of [
    { page: 0 },
    { limit: 101 },
    { page: 1.5 },
    { keyword: 'a'.repeat(101) },
    { isActive: 'false' },
  ]) {
    await request(app.getHttpServer())
      .get('/destinations')
      .query(query)
      .expect(400);
  }
  await request(app.getHttpServer())
    .post('/destinations')
    .send({ title: 'No admin' })
    .expect(404);
  await request(app.getHttpServer())
    .delete(`/votes/${randomUUID()}`)
    .expect(404);
});

it('rejects unauthenticated voting and reading another user history', async () => {
  await request(app.getHttpServer())
    .post('/votes')
    .send({ destinationId: randomUUID() })
    .expect(401);
  await request(app.getHttpServer()).get('/votes/me').expect(401);
});

it('accepts the first three votes, rejects duplicates and the fourth, and reports remaining votes', async () => {
  const { token } = await authenticatedUser();
  const targets = await Promise.all(
    Array.from({ length: 4 }, () => destination()),
  );
  await postVote(token, targets[0].id).expect(201);
  await postVote(token, targets[0].id).expect(409);
  await postVote(token, targets[1].id).expect(201);
  await postVote(token, targets[2].id).expect(201);
  const fourth = await postVote(token, targets[3].id).expect(409);
  expect(fourth.body.message).toContain('3');
  const mine = await request(app.getHttpServer())
    .get('/votes/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  expect(mine.body).toMatchObject({
    usedVotes: 3,
    remainingVotes: 0,
    maxVotes: 3,
  });
  expect(
    mine.body.items
      .map((value: { destinationId: string }) => value.destinationId)
      .sort(),
  ).toEqual(
    targets
      .slice(0, 3)
      .map((value) => value.id)
      .sort(),
  );
  const another = await authenticatedUser();
  const empty = await request(app.getHttpServer())
    .get('/votes/me')
    .set('Authorization', `Bearer ${another.token}`)
    .expect(200);
  expect(empty.body).toMatchObject({
    items: [],
    usedVotes: 0,
    remainingVotes: 3,
  });
});

it('rejects malformed UUIDs and client-supplied user IDs', async () => {
  const { token } = await authenticatedUser();
  await postVote(token, 'invalid').expect(400);
  await request(app.getHttpServer())
    .post('/votes')
    .set('Authorization', `Bearer ${token}`)
    .send({ destinationId: randomUUID(), userId: randomUUID() })
    .expect(400);
});

it('cannot exceed three votes under eight concurrent HTTP requests', async () => {
  const { token, account } = await authenticatedUser();
  const targets = await Promise.all(
    Array.from({ length: 8 }, () => destination()),
  );
  const responses = await Promise.all(
    targets.map((item) => postVote(token, item.id)),
  );
  expect(responses.filter((value) => value.status === 201)).toHaveLength(3);
  expect(responses.filter((value) => value.status === 409)).toHaveLength(5);
  expect(
    await database.getRepository(Vote).countBy({ userId: account.id }),
  ).toBe(3);
});

it('rejects inactive and nonexistent destinations without consuming a vote', async () => {
  const { token } = await authenticatedUser();
  const hidden = await destination({ isActive: false });
  await postVote(token, hidden.id).expect(400);
  await postVote(token, randomUUID()).expect(404);
  const response = await request(app.getHttpServer())
    .get('/votes/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  expect(response.body.usedVotes).toBe(0);
});

it.each([
  {
    VOTING_START_AT: '2998-01-01T00:00:00+07:00',
    VOTING_END_AT: '2999-01-01T00:00:00+07:00',
  },
  {
    VOTING_START_AT: '2000-01-01T00:00:00+07:00',
    VOTING_END_AT: '2001-01-01T00:00:00+07:00',
  },
  { VOTING_START_AT: '', VOTING_END_AT: '' },
])(
  'rejects voting before opening, after closing or without official times (%j)',
  async (schedule) => {
    await app.close();
    app = await createApp(schedule);
    const { token } = await authenticatedUser();
    const target = await destination();
    await postVote(token, target.id).expect(403);
  },
);

it('counts votes directly, includes zero-vote destinations and uses deterministic ranking ties', async () => {
  const targets = await Promise.all(
    [1, 2, 3, 4].map((displayOrder) => destination({ displayOrder })),
  );
  const zeroA = await destination({
    id: '00000000-0000-4000-8000-000000000010',
    displayOrder: 5,
  });
  const zeroB = await destination({
    id: '00000000-0000-4000-8000-000000000011',
    displayOrder: 5,
  });
  const hidden = await destination({ displayOrder: 0 });
  const people = await Promise.all([user(), user(), user()]);
  // Fixture hợp lệ: mỗi user <= 3 phiếu; điểm đến chỉ bị ẩn sau khi có phiếu.
  const pairs = [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 3],
    [2, 0],
  ];
  await database.getRepository(Vote).insert([
    ...pairs.map(([who, which]) => ({
      userId: people[who].id,
      destinationId: targets[which].id,
    })),
    { userId: people[2].id, destinationId: hidden.id },
  ]);
  await database
    .getRepository(Destination)
    .update(hidden.id, { isActive: false });
  const full = await request(app.getHttpServer()).get('/rankings').expect(200);
  expect(full.body).toMatchObject({ totalVotes: 7, totalDestinations: 6 });
  expect(full.body.items.map((item: { id: string }) => item.id)).toEqual([
    ...targets.map((item) => item.id),
    zeroA.id,
    zeroB.id,
  ]);
  expect(
    full.body.items.map((item: { voteCount: number }) => item.voteCount),
  ).toEqual([3, 2, 1, 1, 0, 0]);
  expect(full.body.items.map((item: { rank: number }) => item.rank)).toEqual([
    1, 2, 3, 4, 5, 6,
  ]);
  const top = await request(app.getHttpServer())
    .get('/rankings/top')
    .expect(200);
  expect(top.body.items).toEqual(full.body.items.slice(0, 3));
  expect(top.body.totalVotes).toBe(7);
});

it('keeps a hidden destination in user history without refunding the vote', async () => {
  const { token } = await authenticatedUser();
  const target = await destination();
  await postVote(token, target.id).expect(201);
  await database
    .getRepository(Destination)
    .update(target.id, { isActive: false });
  const mine = await request(app.getHttpServer())
    .get('/votes/me')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  expect(mine.body).toMatchObject({ usedVotes: 1, remainingVotes: 2 });
  expect(mine.body.items[0].destination.id).toBe(target.id);
});

it('seeds sample destinations idempotently without overwriting existing content or sending email', async () => {
  expect(await seedDestinations(database)).toEqual({ insertedDestinations: 3 });
  await database
    .getRepository(Destination)
    .update({ slug: 'demo-lang-xanh' }, { title: 'Edited by operator' });
  expect(await seedDestinations(database)).toEqual({ insertedDestinations: 0 });
  expect(
    (
      await database
        .getRepository(Destination)
        .findOneByOrFail({ slug: 'demo-lang-xanh' })
    ).title,
  ).toBe('Edited by operator');
  expect(mail.sendOtp).not.toHaveBeenCalled();
});
