import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '../src/database/database.config.js';
import {
  Destination,
  DestinationMedia,
} from '../src/database/entities/voting.entities.js';
import { contestEntries } from '../src/database/imports/contest-2026.entries.js';
import { contestImageLinks } from '../src/database/seeds/contest-2026.images.js';
import { seedContestImages } from '../src/database/seeds/contest-images.seed.js';
import { DestinationService } from '../src/services/destination.service.js';
import { RankingService } from '../src/services/ranking.service.js';

const schema = `test_image_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let database: DataSource;
let created = false;
let video: DestinationMedia;
let existingImage: DestinationMedia;
let reusedImage: DestinationMedia;

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
  const first = await database
    .getRepository(Destination)
    .findOneByOrFail({ slug: contestEntries[0].slug });
  const second = await database
    .getRepository(Destination)
    .findOneByOrFail({ slug: contestEntries[1].slug });
  video = await database.getRepository(DestinationMedia).save({
    destinationId: first.id,
    mediaType: 'VIDEO',
    mediaUrl: 'https://vimeo.com/1243184146/c3ed6d3e14',
    caption: 'Keep video',
    displayOrder: 1,
  });
  existingImage = await database.getRepository(DestinationMedia).save({
    destinationId: first.id,
    mediaType: 'IMAGE',
    mediaUrl: 'https://example.com/existing.jpg',
    caption: 'Keep gallery image',
    displayOrder: 5,
  });
  reusedImage = await database.getRepository(DestinationMedia).save({
    destinationId: second.id,
    mediaType: 'IMAGE',
    mediaUrl: contestImageLinks[1],
    caption: 'Already imported',
    displayOrder: 4,
  });
});

afterAll(async () => {
  if (database?.isInitialized) await database.destroy();
  if (created) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

it('seeds thumbnails and images by source slug, supports dry-run/concurrency and preserves video/gallery data', async () => {
  const repo = database.getRepository(Destination);
  const before = await repo.find({ order: { slug: 'ASC' } });
  expect(await seedContestImages(database, true)).toMatchObject({
    insertedImages: 34,
    skippedImages: 1,
    updatedThumbnails: 35,
    repeatedImageEntries: [
      [4, 5],
      [23, 24],
    ],
  });
  expect(await repo.find({ order: { slug: 'ASC' } })).toEqual(before);
  expect(await database.getRepository(DestinationMedia).count()).toBe(3);
  const results = await Promise.all([
    seedContestImages(database),
    seedContestImages(database),
  ]);
  expect(
    results.map((result) => result.insertedImages).sort((a, b) => a - b),
  ).toEqual([0, 34]);
  const after = await repo.find({ order: { slug: 'ASC' } });
  for (const entry of contestEntries) {
    const row = after.find((destination) => destination.slug === entry.slug)!;
    expect(row.thumbnailUrl).toBe(contestImageLinks[entry.sourceOrder - 1]);
    const prior = before.find((destination) => destination.id === row.id)!;
    for (const key of [
      'id',
      'title',
      'slug',
      'brief',
      'detail',
      'province',
      'displayOrder',
      'isActive',
      'createdAt',
    ] as const) {
      expect(row[key]).toEqual(prior[key]);
    }
  }
  const media = database.getRepository(DestinationMedia);
  for (const previous of [video, existingImage, reusedImage])
    expect(await media.findOneByOrFail({ id: previous.id })).toEqual(previous);
  expect(await media.countBy({ mediaType: 'IMAGE' })).toBe(36);
  expect(await seedContestImages(database)).toMatchObject({
    insertedImages: 0,
    updatedImages: 0,
    updatedThumbnails: 0,
    skippedImages: 35,
  });
  const detail = await new DestinationService(database).detail(
    contestEntries[0].slug,
  );
  expect(detail.thumbnailUrl).toBe(contestImageLinks[0]);
  expect(
    detail.media.some(
      (item) =>
        item.mediaType === 'IMAGE' && item.mediaUrl === contestImageLinks[0],
    ),
  ).toBe(true);
  expect(
    detail.media.some(
      (item) => item.id === video.id && item.mediaType === 'VIDEO',
    ),
  ).toBe(true);
  const ranking = await new RankingService(database).list();
  expect(
    ranking.items.find((item) => item.id === detail.id)?.thumbnailUrl,
  ).toBe(contestImageLinks[0]);
});

it('updates the managed image and thumbnail without duplicating or modifying its metadata', async () => {
  const id = 'd1302026-0000-4000-8000-000000000025';
  const media = database.getRepository(DestinationMedia);
  const before = await media.findOneByOrFail({ id });
  await media.update(id, { mediaUrl: 'https://example.com/previous.jpg' });
  await database.getRepository(Destination).update(before.destinationId, {
    thumbnailUrl: 'https://example.com/previous.jpg',
  });
  expect(await seedContestImages(database)).toMatchObject({
    insertedImages: 0,
    updatedImages: 1,
    updatedThumbnails: 1,
    skippedImages: 34,
  });
  expect(await media.findOneByOrFail({ id })).toEqual(before);
});

it('fails on a missing destination without writing thumbnails or media', async () => {
  const repo = database.getRepository(Destination);
  const original = await repo.findOneByOrFail({
    slug: contestEntries[34].slug,
  });
  const before = await database
    .getRepository(DestinationMedia)
    .find({ order: { id: 'ASC' } });
  await repo.update(original.id, { slug: 'temporarily-renamed' });
  try {
    await expect(seedContestImages(database)).rejects.toThrow(
      'Missing contest destinations',
    );
    expect(
      await database
        .getRepository(DestinationMedia)
        .find({ order: { id: 'ASC' } }),
    ).toEqual(before);
  } finally {
    await repo.update(original.id, { slug: original.slug });
  }
});
