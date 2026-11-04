import { In, type DataSource } from 'typeorm';
import { Destination, DestinationMedia } from '../entities/voting.entities.js';
import { contestEntries } from '../imports/contest-2026.entries.js';
import { contestImageLinks } from './contest-2026.images.js';

/** Thumbnail và ảnh chi tiết theo slug gốc; không chỉnh video/nội dung hoặc phiếu. */
export async function seedContestImages(database: DataSource, dryRun = false) {
  if (
    contestImageLinks.length !== 35 ||
    contestEntries.length !== 35 ||
    new Set(contestEntries.map((entry) => entry.sourceOrder)).size !== 35
  ) {
    throw new Error('Expected exactly 35 contest entries and image links.');
  }
  const mappings = contestEntries.map((entry) => {
    const mediaUrl = contestImageLinks[entry.sourceOrder - 1];
    const url = new URL(mediaUrl);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com' ||
      !url.pathname.startsWith('/k7d3jqeq/image/upload/') ||
      url.username ||
      url.password ||
      url.port
    ) {
      throw new Error(`Invalid image URL for ${entry.sourceCode}.`);
    }
    return {
      ...entry,
      mediaUrl,
      mediaId: `d1302026-0000-4000-8000-${String(entry.sourceOrder).padStart(12, '0')}`,
    };
  });
  const repeatedImageEntries = [...new Set(contestImageLinks)]
    .map((url) =>
      mappings
        .filter((entry) => entry.mediaUrl === url)
        .map((entry) => entry.sourceOrder),
    )
    .filter((orders) => orders.length > 1);

  return database.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      'seed:contest-2026:images',
    ]);
    const destinations = await tx.findBy(Destination, {
      slug: In(mappings.map((entry) => entry.slug)),
    });
    const bySlug = new Map(
      destinations.map((destination) => [destination.slug, destination]),
    );
    const missing = mappings.filter((entry) => !bySlug.has(entry.slug));
    if (missing.length)
      throw new Error(
        `Missing contest destinations: ${missing.map((entry) => entry.sourceCode).join(', ')}. Import the 35 entries first.`,
      );
    const media = await tx.findBy(DestinationMedia, {
      destinationId: In(destinations.map((destination) => destination.id)),
    });
    const byId = new Map(media.map((item) => [item.id, item]));
    const inserts: {
      id: string;
      destinationId: string;
      mediaType: 'IMAGE';
      mediaUrl: string;
      caption: string;
      displayOrder: number;
    }[] = [];
    const updates: { id: string; mediaUrl: string }[] = [];
    const thumbnails: { id: string; thumbnail_url: string }[] = [];
    let skippedImages = 0;
    for (const entry of mappings) {
      const destination = bySlug.get(entry.slug)!;
      if (destination.thumbnailUrl !== entry.mediaUrl)
        thumbnails.push({ id: destination.id, thumbnail_url: entry.mediaUrl });
      const owned = byId.get(entry.mediaId);
      if (
        owned &&
        (owned.destinationId !== destination.id || owned.mediaType !== 'IMAGE')
      ) {
        throw new Error(
          `Image seed ID conflicts for ${entry.sourceCode}; transaction rolled back.`,
        );
      }
      if (owned) {
        if (owned.mediaUrl === entry.mediaUrl) skippedImages++;
        else updates.push({ id: owned.id, mediaUrl: entry.mediaUrl });
      } else if (
        media.some(
          (item) =>
            item.destinationId === destination.id &&
            item.mediaType === 'IMAGE' &&
            item.mediaUrl === entry.mediaUrl,
        )
      ) {
        skippedImages++;
      } else {
        inserts.push({
          id: entry.mediaId,
          destinationId: destination.id,
          mediaType: 'IMAGE',
          mediaUrl: entry.mediaUrl,
          caption: `Ảnh đại diện bài dự thi ${entry.sourceCode}`,
          displayOrder: 0,
        });
      }
    }
    if (!dryRun) {
      if (inserts.length) await tx.insert(DestinationMedia, inserts);
      for (const update of updates)
        await tx.update(DestinationMedia, update.id, {
          mediaUrl: update.mediaUrl,
        });
      if (thumbnails.length) {
        // Một UPDATE batch, URL/UUID bind qua JSON; schema lấy từ metadata TypeORM.
        const metadata = database.getMetadata(Destination);
        const table = `${database.driver.escape(metadata.schema ?? 'public')}.${database.driver.escape(metadata.tableName)}`;
        await tx.query(
          `UPDATE ${table} AS destination
          SET thumbnail_url = source.thumbnail_url
          FROM jsonb_to_recordset($1::jsonb) AS source(id uuid, thumbnail_url text)
          WHERE destination.id = source.id AND destination.thumbnail_url IS DISTINCT FROM source.thumbnail_url`,
          [JSON.stringify(thumbnails)],
        );
      }
    }
    return {
      dryRun,
      totalEntries: mappings.length,
      insertedImages: inserts.length,
      updatedImages: updates.length,
      updatedThumbnails: thumbnails.length,
      skippedImages,
      repeatedImageEntries,
    };
  });
}
