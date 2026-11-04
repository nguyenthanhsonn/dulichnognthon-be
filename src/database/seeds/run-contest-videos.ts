import database from '../data-source.js';
import { seedContestVideos } from './contest-videos.seed.js';

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dry-run'))
    throw new Error('Only --dry-run is supported.');
  await database.initialize();
  console.log(
    JSON.stringify(
      await seedContestVideos(database, args.includes('--dry-run')),
      null,
      2,
    ),
  );
} finally {
  if (database.isInitialized) await database.destroy();
}
