import database from '../data-source.js';
import { importContest2026 } from './import-contest-2026.js';

try {
  await database.initialize();
  console.log(await importContest2026(database));
} finally {
  if (database.isInitialized) await database.destroy();
}
