import { In, type DataSource } from 'typeorm';
import { Destination } from '../entities/voting.entities.js';
import { contestEntries } from '../imports/contest-2026.entries.js';
import { contestCardEntries } from './contest-2026.cards.js';

/** Ghép theo số bài trong nguồn gốc -> slug; không phụ thuộc thứ tự hiển thị DB. */
export async function seedContestCards(database: DataSource, dryRun = false) {
  const mappings = contestCardEntries.map((card) => {
    const entry = contestEntries.find(
      (item) => item.sourceOrder === card.sourceOrder,
    );
    if (!entry) throw new Error(`Unknown contest entry: ${card.sourceOrder}`);
    return { ...card, slug: entry.slug };
  });
  if (
    new Set(mappings.map((item) => item.slug)).size !== mappings.length ||
    new Set(mappings.map((item) => item.contestCode)).size !== mappings.length
  )
    throw new Error('Duplicate contest card mapping.');
  return database.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      'seed:contest-2026:cards',
    ]);
    const destinations = await tx.findBy(Destination, {
      slug: In(mappings.map((item) => item.slug)),
    });
    const bySlug = new Map(destinations.map((item) => [item.slug, item]));
    const missing = mappings.filter((item) => !bySlug.has(item.slug));
    if (missing.length)
      throw new Error(
        `Missing contest destinations: ${missing.map((item) => item.contestCode).join(', ')}`,
      );
    const changes = mappings.filter((item) => {
      const current = bySlug.get(item.slug)!;
      return (
        current.contestCode !== item.contestCode ||
        current.shortTitle !== item.shortTitle
      );
    });
    if (!dryRun && changes.length) {
      // Batch update duy nhất, chỉ hai field card; dữ liệu bind bằng parameter.
      const metadata = database.getMetadata(Destination);
      const table = `${database.driver.escape(metadata.schema ?? 'public')}.${database.driver.escape(metadata.tableName)}`;
      await tx.query(
        `UPDATE ${table} AS destination
        SET contest_code = source.code, short_title = source.title
        FROM jsonb_to_recordset($1::jsonb) AS source(slug text, code text, title text)
        WHERE destination.slug = source.slug`,
        [
          JSON.stringify(
            changes.map((item) => ({
              slug: item.slug,
              code: item.contestCode,
              title: item.shortTitle,
            })),
          ),
        ],
      );
    }
    return {
      dryRun,
      totalEntries: mappings.length,
      updated: changes.length,
      skipped: mappings.length - changes.length,
      missingFromSource: contestEntries
        .filter(
          (entry) =>
            !mappings.some((item) => item.sourceOrder === entry.sourceOrder),
        )
        .map((entry) => entry.sourceOrder),
    };
  });
}
