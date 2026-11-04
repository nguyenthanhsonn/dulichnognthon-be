import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { DataSource, In } from 'typeorm';
import { createDatabaseOptions } from '../src/database/database.config.js';
import {
  Destination,
  DestinationMedia,
} from '../src/database/entities/voting.entities.js';
import { contestEntries } from '../src/database/imports/contest-2026.entries.js';
import { seedContestVideos } from '../src/database/seeds/contest-videos.seed.js';
import {
  contestVideoLinks,
  normalizeVimeoUrl,
} from '../src/database/seeds/contest-2026.videos.js';

const schema = `test_video_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let database: DataSource;
let created = false;
let firstId: string;
let imageId: string;

beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  database = new DataSource(createDatabaseOptions(url.toString()));
  await database.initialize();
  await database.runMigrations();
  // Đảo display_order: seed vẫn phải gắn đúng theo slug từ tài liệu gốc.
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
  const first = await database
    .getRepository(Destination)
    .findOneByOrFail({ slug: contestEntries[0].slug });
  firstId = first.id;
  const image = await database.getRepository(DestinationMedia).save({
    destinationId: first.id,
    mediaType: 'IMAGE',
    mediaUrl: 'https://example.com/keep.png',
    caption: 'Keep this image',
    displayOrder: 2,
  });
  imageId = image.id;
});

afterAll(async () => {
  if (database?.isInitialized) await database.destroy();
  if (created) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

it('previews without writing and seeds concurrently without duplicating media or changing content', async () => {
  const before = await database
    .getRepository(Destination)
    .find({ order: { slug: 'ASC' } });
  expect(await seedContestVideos(database, true)).toMatchObject({
    dryRun: true,
    inserted: 35,
    updated: 0,
    skipped: 0,
  });
  expect(
    await database
      .getRepository(DestinationMedia)
      .countBy({ mediaType: 'VIDEO' }),
  ).toBe(0);
  const results = await Promise.all([
    seedContestVideos(database),
    seedContestVideos(database),
  ]);
  expect(
    results.map((result) => result.inserted).sort((a, b) => a - b),
  ).toEqual([0, 35]);
  expect(
    await database
      .getRepository(DestinationMedia)
      .countBy({ mediaType: 'VIDEO' }),
  ).toBe(35);
  const firstVideo = await database
    .getRepository(DestinationMedia)
    .findOneByOrFail({ destinationId: firstId, mediaType: 'VIDEO' });
  expect(firstVideo).toMatchObject({
    mediaUrl: 'https://vimeo.com/1243184146/c3ed6d3e14',
    displayOrder: 3,
  });
  expect(
    await database
      .getRepository(DestinationMedia)
      .findOneByOrFail({ id: imageId }),
  ).toMatchObject({
    caption: 'Keep this image',
    mediaUrl: 'https://example.com/keep.png',
    displayOrder: 2,
  });
  expect(
    await database.getRepository(Destination).find({ order: { slug: 'ASC' } }),
  ).toEqual(before);
  expect(await seedContestVideos(database)).toMatchObject({
    inserted: 0,
    updated: 0,
    skipped: 35,
  });
});

it('rejects missing destinations without changing any media', async () => {
  const entry = contestEntries[34];
  const repo = database.getRepository(Destination);
  const before = await database
    .getRepository(DestinationMedia)
    .find({ order: { id: 'ASC' } });
  await repo.update({ slug: entry.slug }, { slug: 'temporarily-renamed' });
  try {
    await expect(seedContestVideos(database)).rejects.toThrow(
      'Missing contest destinations',
    );
    expect(
      await database
        .getRepository(DestinationMedia)
        .find({ order: { id: 'ASC' } }),
    ).toEqual(before);
  } finally {
    await repo.update({ slug: 'temporarily-renamed' }, { slug: entry.slug });
  }
});

it('replaces the six corrected video links without changing media IDs or metadata', async () => {
  await seedContestVideos(database);
  const orders = [16, 17, 18, 19, 20, 29];
  const ids = orders.map(
    (order) => `d1202026-0000-4000-8000-${String(order).padStart(12, '0')}`,
  );
  const repo = database.getRepository(DestinationMedia);
  const before = await repo.find({ order: { id: 'ASC' } });
  await repo.update(
    { id: In(ids.slice(0, 5)) },
    { mediaUrl: 'https://vimeo.com/1243134240' },
  );
  await repo.update(ids[5], { mediaUrl: 'https://vimeo.com/1243136295' });
  expect(await seedContestVideos(database, true)).toMatchObject({
    inserted: 0,
    updated: 6,
    skipped: 29,
  });
  expect(await seedContestVideos(database)).toMatchObject({
    inserted: 0,
    updated: 6,
    skipped: 29,
  });
  const after = await repo.find({ order: { id: 'ASC' } });
  expect(after).toEqual(before);
  for (const order of orders) {
    expect(
      after.find((media) => media.id === ids[orders.indexOf(order)])?.mediaUrl,
    ).toBe(normalizeVimeoUrl(contestVideoLinks[order - 1]));
  }
});
