import { contestEntries } from '../imports/contest-2026.entries.js';
import { contestVideoLinks, normalizeVimeoUrl } from './contest-2026.videos.js';

it('maps all 35 source numbers and preserves the supplied duplicate videos', () => {
  expect(contestVideoLinks).toHaveLength(35);
  expect(contestEntries.map((entry) => entry.sourceOrder)).toEqual(
    Array.from({ length: 35 }, (_, i) => i + 1),
  );
  expect(normalizeVimeoUrl(contestVideoLinks[0])).toBe(
    'https://vimeo.com/1243184146/c3ed6d3e14',
  );
  expect(normalizeVimeoUrl(contestVideoLinks[6])).toBe(
    'https://vimeo.com/1242903360',
  );
  const matching = contestVideoLinks.flatMap((link, i) =>
    normalizeVimeoUrl(link) === 'https://vimeo.com/1243134240' ? [i + 1] : [],
  );
  expect(matching).toEqual([15, 16, 17, 18, 19, 20, 22]);
  expect(normalizeVimeoUrl(contestVideoLinks[27])).toBe(
    normalizeVimeoUrl(contestVideoLinks[28]),
  );
});

it.each([
  'http://vimeo.com/123',
  'https://evil.example/123',
  'https://vimeo.com/manage/videos',
  'https://vimeo.com/123/../../manage',
  'https://user:secret@vimeo.com/123',
])('rejects unsupported links: %s', (url) =>
  expect(() => normalizeVimeoUrl(url)).toThrow(),
);
