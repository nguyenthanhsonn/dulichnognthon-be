import { In, type DataSource } from 'typeorm';
import { Destination } from '../entities/voting.entities.js';
import { contestEntries, contestSource } from './contest-2026.entries.js';

/** Import một lần trong transaction; chạy lại không ghi đè nội dung/media đã có. */
export async function importContest2026(database: DataSource) {
  if (
    contestEntries.length !== 35 ||
    new Set(contestEntries.map((entry) => entry.slug)).size !== 35
  ) {
    throw new Error(
      'The source must contain exactly 35 distinct contest entries.',
    );
  }
  return database.transaction(async (tx) => {
    // Hai lần import cùng tài liệu phải được thực hiện tuần tự.
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      contestSource.url,
    ]);
    const slugs = contestEntries.map((entry) => entry.slug);
    const sameTitles = await tx.findBy(Destination, {
      title: In(contestEntries.map((entry) => entry.title)),
    });
    if (sameTitles.some((entry) => !slugs.includes(entry.slug))) {
      throw new Error(
        'A destination with the same title already exists under another slug. Review before importing.',
      );
    }
    const result = await tx
      .createQueryBuilder()
      .insert()
      .into(Destination)
      .values(
        contestEntries.map((entry) => ({
          title: entry.title,
          slug: entry.slug,
          brief: entry.brief,
          detail: entry.detail,
          province: entry.province,
          displayOrder: entry.sourceOrder,
          isActive: true,
          thumbnailUrl: null,
        })),
      )
      .orIgnore()
      .returning(['id', 'slug'])
      .execute();

    const stored = await tx.findBy(Destination, { slug: In(slugs) });
    const bySlug = new Map(stored.map((entry) => [entry.slug, entry]));
    for (const entry of contestEntries) {
      const record = bySlug.get(entry.slug);
      // Nếu slug đã tồn tại nhưng nội dung khác, rollback toàn bộ thay vì ghi đè.
      if (
        !record ||
        record.title !== entry.title ||
        record.brief !== entry.brief ||
        record.detail !== entry.detail ||
        record.province !== entry.province
      ) {
        throw new Error(
          `Imported content does not match source entry ${entry.sourceCode}.`,
        );
      }
    }
    const inserted = (result.raw as { id: string }[]).length;
    return {
      inserted,
      skipped: 35 - inserted,
      totalEntries: stored.length,
      missingProvince: contestEntries
        .filter((entry) => entry.province === null)
        .map((entry) => entry.sourceCode),
    };
  });
}
