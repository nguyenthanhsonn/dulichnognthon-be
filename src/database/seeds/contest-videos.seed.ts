import { In, type DataSource } from 'typeorm';
import { Destination, DestinationMedia } from '../entities/voting.entities.js';
import { contestEntries } from '../imports/contest-2026.entries.js';
import { contestVideoLinks, normalizeVimeoUrl } from './contest-2026.videos.js';

/** Gắn video theo slug của bài gốc; không dựa vào display_order có thể bị thay đổi. */
export async function seedContestVideos(database: DataSource, dryRun = false) {
  const mappings = contestEntries.map((entry) => ({
    ...entry,
    mediaUrl: normalizeVimeoUrl(contestVideoLinks[entry.sourceOrder - 1]),
    // ID ổn định riêng của seed giúp chạy lại/cập nhật link không sinh video trùng.
    mediaId: `d1202026-0000-4000-8000-${String(entry.sourceOrder).padStart(12, '0')}`,
  }));
  if (
    mappings.length !== 35 ||
    new Set(mappings.map((entry) => entry.sourceOrder)).size !== 35 ||
    mappings.some((entry) => entry.sourceOrder < 1 || entry.sourceOrder > 35)
  ) {
    throw new Error('Expected exactly 35 contest entries and video links.');
  }
  const repeatedLinks = [...new Set(mappings.map((entry) => entry.mediaUrl))]
    .map((mediaUrl) => ({
      mediaUrl,
      entries: mappings
        .filter((entry) => entry.mediaUrl === mediaUrl)
        .map((entry) => entry.sourceOrder),
    }))
    .filter((item) => item.entries.length > 1);

  return database.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      'seed:contest-2026:videos',
    ]);
    const destinations = await tx.findBy(Destination, {
      slug: In(mappings.map((entry) => entry.slug)),
    });
    const bySlug = new Map(
      destinations.map((destination) => [destination.slug, destination]),
    );
    const missing = mappings.filter((entry) => !bySlug.has(entry.slug));
    if (missing.length) {
      throw new Error(
        `Missing contest destinations: ${missing.map((entry) => entry.sourceCode).join(', ')}. Import the 35 entries first.`,
      );
    }
    const media = await tx.findBy(DestinationMedia, {
      destinationId: In(destinations.map((destination) => destination.id)),
    });
    const byId = new Map(media.map((item) => [item.id, item]));
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    for (const entry of mappings) {
      const destination = bySlug.get(entry.slug)!;
      const owned = byId.get(entry.mediaId);
      if (
        owned &&
        (owned.destinationId !== destination.id || owned.mediaType !== 'VIDEO')
      ) {
        throw new Error(
          `Seed media ID conflicts for ${entry.sourceCode}; transaction rolled back.`,
        );
      }
      if (owned) {
        if (owned.mediaUrl === entry.mediaUrl) skipped++;
        else {
          if (!dryRun)
            await tx.update(DestinationMedia, owned.id, {
              mediaUrl: entry.mediaUrl,
            });
          updated++;
        }
        continue;
      }
      // Nếu video đúng đã được nhập bằng cách khác, giữ nguyên ID/caption/thứ tự đó.
      if (
        media.some(
          (item) =>
            item.destinationId === destination.id &&
            item.mediaType === 'VIDEO' &&
            item.mediaUrl === entry.mediaUrl,
        )
      ) {
        skipped++;
        continue;
      }
      const displayOrder =
        Math.max(
          0,
          ...media
            .filter((item) => item.destinationId === destination.id)
            .map((item) => item.displayOrder),
        ) + 1;
      if (!dryRun)
        await tx.insert(DestinationMedia, {
          id: entry.mediaId,
          destinationId: destination.id,
          mediaType: 'VIDEO',
          mediaUrl: entry.mediaUrl,
          caption: `Video bài dự thi ${entry.sourceCode}`,
          displayOrder,
        });
      inserted++;
    }
    return {
      dryRun,
      totalEntries: mappings.length,
      inserted,
      updated,
      skipped,
      repeatedLinks,
      managementLinkConverted: contestVideoLinks.flatMap((link, index) =>
        new URL(link).pathname.startsWith('/manage/videos/') ? [index + 1] : [],
      ),
    };
  });
}
