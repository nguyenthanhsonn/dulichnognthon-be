import database from '../data-source.js';
import { seedDestinations } from './destinations.seed.js';

try {
  await database.initialize();
  console.log(await seedDestinations(database));
} finally {
  if (database.isInitialized) await database.destroy();
}
