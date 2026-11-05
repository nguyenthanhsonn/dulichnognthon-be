import { Logger, type MessageEvent } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RankingService } from './ranking.service.js';

const rows = (votes = 0) =>
  Array.from({ length: 4 }, (_, i) => ({
    id: `destination-${i}`,
    title: `Full ${i}`,
    shortTitle: `Short ${i}`,
    contestCode: `DLNT0${i + 1}`,
    slug: `slug-${i}`,
    brief: '',
    province: null,
    thumbnailUrl: null,
    displayOrder: i,
    rank: String(i + 1),
    voteCount: String(i === 0 ? votes : 0),
    totalVotes: String(votes),
    totalDestinations: '4',
  }));

function fixture() {
  const query = {
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue(rows()),
  };
  const database = {
    getRepository: () => ({ createQueryBuilder: () => query }),
  } as unknown as DataSource;
  return { service: new RankingService(database), read: query.getRawMany };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('deduplicates concurrent top/full reads, expires cache, and protects cached objects', async () => {
  vi.useFakeTimers();
  const { service, read } = fixture();
  const [full, top] = await Promise.all([service.list(), service.list(true)]);
  expect(read).toHaveBeenCalledTimes(1);
  expect(top.items).toEqual(full.items.slice(0, 3));
  expect(top.totalDestinations).toBe(4);
  full.items[0].voteCount = 999;
  expect((await service.list()).items[0].voteCount).toBe(0);
  await vi.advanceTimersByTimeAsync(1001);
  await service.list();
  expect(read).toHaveBeenCalledTimes(2);
  service.onModuleDestroy();
});

it('does not serve or cache a query started before a committed vote', async () => {
  const { service, read } = fixture();
  let resolve!: (value: ReturnType<typeof rows>) => void;
  read.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = service.list();
  service.invalidate();
  read.mockResolvedValue(rows(1));
  resolve(rows(0));
  expect((await pending).totalVotes).toBe(1);
  expect((await service.list()).totalVotes).toBe(1);
  expect(read).toHaveBeenCalledTimes(2);
  service.onModuleDestroy();
});

it('shares SSE queries, pushes changed rankings, catches external writes, stops when clients leave', async () => {
  vi.useFakeTimers();
  const { service, read } = fixture();
  const first: MessageEvent[] = [];
  const second: MessageEvent[] = [];
  const a = service.stream().subscribe((event) => first.push(event));
  const b = service.stream().subscribe((event) => second.push(event));
  await vi.advanceTimersByTimeAsync(30);
  expect(read).toHaveBeenCalledTimes(1);
  expect(first[0]).toMatchObject({ type: 'rankings', data: { totalVotes: 0 } });
  expect(second).toEqual(first);
  read.mockResolvedValue(rows(1));
  service.invalidate();
  await vi.advanceTimersByTimeAsync(30);
  expect(first.at(-1)).toMatchObject({
    type: 'rankings',
    data: { totalVotes: 1 },
  });
  // Uneventful refreshes do not push duplicate payloads.
  await vi.advanceTimersByTimeAsync(2100);
  expect(first.filter((event) => event.type === 'rankings')).toHaveLength(2);
  read.mockResolvedValue(rows(2)); // Another instance/direct DB write, no local invalidation.
  await vi.advanceTimersByTimeAsync(2100);
  expect(first.at(-1)).toMatchObject({
    type: 'rankings',
    data: { totalVotes: 2 },
  });
  a.unsubscribe();
  b.unsubscribe();
  const count = read.mock.calls.length;
  await vi.advanceTimersByTimeAsync(10000);
  expect(read).toHaveBeenCalledTimes(count);
  service.onModuleDestroy();
});

it('keeps the stream open on database failure and retries without inventing empty rankings', async () => {
  vi.useFakeTimers();
  vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  const { service, read } = fixture();
  read.mockRejectedValueOnce(new Error('temporarily unavailable'));
  const events: MessageEvent[] = [];
  const subscription = service
    .stream()
    .subscribe((event) => events.push(event));
  await vi.advanceTimersByTimeAsync(30);
  expect(events).toEqual([]);
  expect(subscription.closed).toBe(false);
  await vi.advanceTimersByTimeAsync(2100);
  expect(events[0]).toMatchObject({
    type: 'rankings',
    data: { totalDestinations: 4 },
  });
  service.onModuleDestroy();
  expect(subscription.closed).toBe(true);
});

it('bounds refresh retries when votes commit continuously instead of starving requests', async () => {
  const { service, read } = fixture();
  let writes = 0;
  read.mockImplementation(async () => {
    writes++;
    service.invalidate();
    return rows(writes);
  });
  expect((await service.list()).totalVotes).toBe(2);
  expect(read).toHaveBeenCalledTimes(2);
  expect((await service.list()).totalVotes).toBe(4);
  service.onModuleDestroy();
});
