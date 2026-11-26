import { vi } from 'vitest';

// Database integration tests exercise voting while the contest is open.
// The real cutoff is covered by src/common/contest-deadline.spec.ts.
vi.mock('../src/common/contest-deadline.js', () => ({
  contestClosesAt: () => Number.POSITIVE_INFINITY,
  assertContestOpen: () => {},
  isContestClosed: () => false,
}));
