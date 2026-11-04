import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'test/database.integration-spec.ts',
      'test/auth.integration-spec.ts',
      'test/auth-email-migration.integration-spec.ts',
      'test/competition.integration-spec.ts',
      'test/contest-videos.integration-spec.ts',
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
