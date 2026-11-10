import { Test } from '@nestjs/testing';
import { Global, Module, type INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { RankingModule } from '../src/modules/ranking.module.js';
import { DatabaseModule } from '../src/database/database.module.js';
import { RankingService } from '../src/services/ranking.service.js';

// All reads are stubbed: this suite never connects to production or writes votes.
let votes = 0;
const rows = () =>
  Array.from({ length: 35 }, (_, index) => ({
    id: `destination-${index}`,
    title: `Destination ${index}`,
    shortTitle: `Short ${index}`,
    contestCode: `DLNT${index + 1}`,
    slug: `slug-${index}`,
    brief: 'Metadata remains identical between vote updates. '.repeat(10),
    province: 'Tuyên Quang',
    thumbnailUrl: `https://example.com/${index}.jpg`,
    displayOrder: index,
    voteCount: String(index === 0 ? votes : 0),
    rank: String(index + 1),
    totalVotes: String(votes),
    totalDestinations: '35',
  }));
const query = {
  leftJoin() {
    return this;
  },
  where() {
    return this;
  },
  select() {
    return this;
  },
  addSelect() {
    return this;
  },
  groupBy() {
    return this;
  },
  orderBy() {
    return this;
  },
  addOrderBy() {
    return this;
  },
  async getRawMany() {
    return rows();
  },
};
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useValue: { getRepository: () => ({ createQueryBuilder: () => query }) },
    },
  ],
  exports: [DataSource],
})
class StubDatabaseModule {}
let app: INestApplication;
let origin: string;
beforeEach(async () => {
  votes = 0;
  const module = await Test.createTestingModule({ imports: [RankingModule] })
    .overrideModule(DatabaseModule)
    .useModule(StubDatabaseModule)
    .compile();
  app = module.createNestApplication();
  await app.listen(0, '127.0.0.1');
  origin = `http://127.0.0.1:${(app.getHttpServer().address() as { port: number }).port}`;
});
afterEach(async () => {
  await app.close();
});

async function connect(compact: boolean, encoding: string) {
  const controller = new AbortController();
  const response = await fetch(
    `${origin}/rankings/stream${compact ? '?compact=1' : ''}`,
    {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
      headers: { 'Accept-Encoding': encoding },
    },
  );
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  return {
    response,
    async next(): Promise<{
      type: string;
      data: { totalVotes: number; items: Record<string, unknown>[] };
    }> {
      while (true) {
        const index = buffer.indexOf('\n\n');
        if (index >= 0) {
          const frame = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          const data = frame
            .split('\n')
            .find((line) => line.startsWith('data: '));
          if (!data) continue;
          return {
            type: frame
              .split('\n')
              .find((line) => line.startsWith('event: '))!
              .slice(7),
            data: JSON.parse(data.slice(6)),
          };
        }
        const chunk = await reader.read();
        if (chunk.done) throw new Error('SSE ended before update');
        buffer += decoder
          .decode(chunk.value, { stream: true })
          .replaceAll('\r\n', '\n');
      }
    },
    async close() {
      controller.abort();
      await reader.cancel().catch(() => {});
    },
  };
}

it.each(['gzip', 'br'])(
  'flushes %s legacy frames immediately and preserves complete rankings after a vote',
  async (encoding) => {
    const stream = await connect(false, encoding);
    try {
      expect(stream.response.status).toBe(200);
      expect(stream.response.headers.get('content-encoding')).toBe(encoding);
      expect(stream.response.headers.get('x-accel-buffering')).toBe('no');
      expect(stream.response.headers.get('access-control-allow-origin')).toBe(
        '*',
      );
      expect((await stream.next()).data.items[0].title).toBe('Destination 0');
      votes = 9;
      app.get(RankingService).invalidate();
      const event = await stream.next();
      expect(event.type).toBe('rankings');
      expect(event.data.totalVotes).toBe(9);
      expect(event.data.items[0]).toMatchObject({
        title: 'Destination 0',
        voteCount: 9,
      });
    } finally {
      await stream.close();
    }
  },
);

it('supports identity clients and gives compact reconnects metadata before absolute counts', async () => {
  const stream = await connect(true, 'identity');
  try {
    expect(stream.response.headers.get('content-encoding')).toBeNull();
    expect((await stream.next()).type).toBe('rankings');
    votes = 3;
    app.get(RankingService).invalidate();
    const event = await stream.next();
    expect(event.type).toBe('ranking-counts');
    expect(event.data.items[0]).toEqual({
      id: 'destination-0',
      rank: 1,
      voteCount: 3,
    });
    expect(event.data.totalVotes).toBe(3);
    const reconnected = await connect(true, 'gzip');
    try {
      const first = await reconnected.next();
      expect(first.type).toBe('rankings');
      expect(first.data.items[0]).toMatchObject({
        title: 'Destination 0',
        voteCount: 3,
      });
    } finally {
      await reconnected.close();
    }
  } finally {
    await stream.close();
  }
});

it('keeps existing REST responses unchanged and exposes counts without metadata', async () => {
  votes = 12;
  const full = await request(app.getHttpServer()).get('/rankings').expect(200);
  const counts = await request(app.getHttpServer())
    .get('/rankings/counts')
    .expect(200);
  const top = await request(app.getHttpServer())
    .get('/rankings/top')
    .expect(200);
  expect(full.body.items).toHaveLength(35);
  expect(top.body.items).toHaveLength(3);
  expect(counts.headers['cache-control']).toBe('no-store');
  expect(counts.body.items[0]).toEqual({
    id: 'destination-0',
    voteCount: 12,
    rank: 1,
  });
  expect(counts.body.totalVotes).toBe(full.body.totalVotes);
  expect(JSON.stringify(counts.body).length).toBeLessThan(
    JSON.stringify(full.body).length / 5,
  );
});
