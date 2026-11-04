import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '../src/database/database.config.js';
import { Destination } from '../src/database/entities/voting.entities.js';
import { contestEntries } from '../src/database/imports/contest-2026.entries.js';
import { seedContestCards } from '../src/database/seeds/contest-cards.seed.js';
import { DestinationService } from '../src/services/destination.service.js';
import { RankingService } from '../src/services/ranking.service.js';

const schema = `test_card_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let database: DataSource;
let created = false;
beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  database = new DataSource(createDatabaseOptions(url.toString()));
  await database.initialize();
  await database.runMigrations();
  await database.getRepository(Destination).insert(
    contestEntries.map((entry) => ({
      title: entry.title,
      slug: entry.slug,
      brief: entry.brief,
      detail: entry.detail,
      province: entry.province,
      displayOrder: 100 - entry.sourceOrder,
    })),
  );
});

afterAll(async () => {
  if (database?.isInitialized) await database.destroy();
  if (created) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

it('imports card metadata idempotently while preserving full destination data', async () => {
  const repo = database.getRepository(Destination);
  const before = await repo.find({ order: { slug: 'ASC' } });
  expect(await seedContestCards(database, true)).toMatchObject({
    updated: 35,
    missingFromSource: [],
  });
  expect(await repo.find({ order: { slug: 'ASC' } })).toEqual(before);
  expect(await seedContestCards(database)).toMatchObject({ updated: 35 });
  expect(await seedContestCards(database)).toMatchObject({
    updated: 0,
    skipped: 35,
  });
  const after = await repo.find({ order: { slug: 'ASC' } });
  for (let i = 0; i < before.length; i++) {
    const {
      updatedAt: _oldUpdatedAt,
      contestCode: _oldCode,
      shortTitle: _oldTitle,
      ...oldFields
    } = before[i];
    const {
      updatedAt: _newUpdatedAt,
      contestCode: _newCode,
      shortTitle: _newTitle,
      ...newFields
    } = after[i];
    expect(newFields).toEqual(oldFields);
  }
  const service = new DestinationService(database);
  const result = await service.list({ page: 1, limit: 10, keyword: 'DLNT013' });
  expect(result.total).toBe(1);
  expect(result.items[0]).toMatchObject({
    contestCode: 'DLNT013',
    shortTitle: 'Làng du lịch cộng đồng Yên Đức',
  });
  const detail = await service.detail(contestEntries[12].slug);
  expect(detail.title).toBe(contestEntries[12].title);
  expect(detail.detail).toBe(contestEntries[12].detail);
  for (const order of [8, 9]) {
    const card = await service.detail(contestEntries[order - 1].slug);
    expect(card.contestCode).toBe(`DLNT0${order}`);
    expect(card.shortTitle).toBe(contestEntries[order - 1].title);
    expect(card.title).toBe(contestEntries[order - 1].title);
  }
  const rankings = await new RankingService(database).list();
  expect(rankings.items.find((row) => row.id === detail.id)).toMatchObject({
    contestCode: 'DLNT013',
    shortTitle: detail.shortTitle,
    title: detail.title,
  });
});

it('rejects a missing mapping before making any writes', async () => {
  const repo = database.getRepository(Destination);
  await repo.update({ slug: contestEntries[0].slug }, { slug: 'renamed' });
  await repo.update(
    { slug: contestEntries[1].slug },
    { shortTitle: 'Preserve on failure' },
  );
  await expect(seedContestCards(database)).rejects.toThrow(
    'Missing contest destinations',
  );
  expect(
    (await repo.findOneByOrFail({ slug: contestEntries[1].slug })).shortTitle,
  ).toBe('Preserve on failure');
});
