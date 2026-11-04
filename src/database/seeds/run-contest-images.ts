import database from '../data-source.js';
import { seedContestImages } from './contest-images.seed.js';

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dry-run'))
    throw new Error('Only --dry-run is supported.');
  await database.initialize();
  console.log(
    JSON.stringify(
      await seedContestImages(database, args.includes('--dry-run')),
      null,
      2,
    ),
  );
} finally {
  if (database.isInitialized) await database.destroy();
}
