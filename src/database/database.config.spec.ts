import { getDatabaseUrl } from './database.config.js';

describe('PostgreSQL configuration', () => {
  it.each([undefined, '', '   '])('rejects a missing URL (%s)', (url) => {
    expect(() => getDatabaseUrl(url)).toThrow('DATABASE_URL is required');
  });

  it.each([
    'not-a-url',
    'mysql://user:secret@localhost/dulich',
    'postgresql://localhost/dulich',
    'postgresql://user:secret@localhost/',
  ])('rejects invalid configuration without revealing credentials', (url) => {
    expect(() => getDatabaseUrl(url)).toThrow('DATABASE_URL');
    try {
      getDatabaseUrl(url);
    } catch (error) {
      expect((error as Error).message).not.toContain(url);
      expect((error as Error).message).not.toContain('secret');
    }
  });

  it.each(['postgres', 'postgresql'])(
    'accepts %s URLs and preserves TLS settings',
    (protocol) => {
      const url = `${protocol}://user:p%40ss@db.example.com:5432/dulich?sslmode=verify-full`;
      expect(getDatabaseUrl(` ${url} `)).toBe(url);
    },
  );
});
