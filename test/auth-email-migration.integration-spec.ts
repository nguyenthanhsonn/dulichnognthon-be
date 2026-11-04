import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from '../src/database/database.config.js';
import { User } from '../src/database/entities/voting.entities.js';

// Thử nâng cấp từ schema phone thật, không dùng entity email trước khi migration chạy.
const schema = `test_email_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let database: DataSource;
let created = false;
const userId = randomUUID();
const destinationId = randomUUID();

beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await client.query(`SET search_path TO "${schema}"`);
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  const options = createDatabaseOptions(url.toString());
  const migrations = options.migrations as Function[];
  database = new DataSource({ ...options, migrations: migrations.slice(0, 2) });
  await database.initialize();
  await database.runMigrations();
  await client.query('INSERT INTO users (id, phone) VALUES ($1, $2)', [
    userId,
    '+84901234567',
  ]);
  await client.query(
    "INSERT INTO destinations (id, title, slug, brief, detail) VALUES ($1, 'Legacy', 'legacy', 'brief', 'detail')",
    [destinationId],
  );
  await client.query(
    'INSERT INTO votes (user_id, destination_id) VALUES ($1, $2)',
    [userId, destinationId],
  );
  await client.query(
    "INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at) VALUES ($1, 'legacy-refresh-hash', now() + interval '1 day')",
    [userId],
  );
  await client.query(
    "INSERT INTO otp_codes (user_id, phone, code_hash, expires_at) VALUES ($1, '+84901234567', 'legacy-otp-hash', now() + interval '5 minutes')",
    [userId],
  );
  await database.destroy();
  database = new DataSource(options);
  await database.initialize();
  await database.runMigrations();
});

afterAll(async () => {
  if (database?.isInitialized) await database.destroy();
  if (created) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

it('preserves legacy account IDs, phone, votes, sessions and challenges', async () => {
  expect(
    await database.getRepository(User).findOneByOrFail({ id: userId }),
  ).toMatchObject({ phone: '+84901234567', email: null });
  for (const table of ['votes', 'auth_sessions', 'otp_codes']) {
    const { rows } = await client.query(
      `SELECT * FROM ${table} WHERE user_id = $1`,
      [userId],
    );
    expect(rows).toHaveLength(1);
  }
  expect(
    (
      await client.query(
        'SELECT destination_id FROM votes WHERE user_id = $1',
        [userId],
      )
    ).rows[0].destination_id,
  ).toBe(destinationId);
  expect(await database.runMigrations()).toEqual([]);
});

it('allows email-only accounts and enforces canonical uniqueness and identity', async () => {
  const repo = database.getRepository(User);
  const user = await repo.save({ email: 'voter@example.com' });
  expect(user.phone).toBeNull();
  await expect(repo.save({ email: 'voter@example.com' })).rejects.toThrow();
  await expect(repo.save({ email: 'Voter@Example.com' })).rejects.toThrow();
  await expect(repo.save({ email: ' voter@example.com ' })).rejects.toThrow();
  await expect(repo.save({ email: null, phone: null })).rejects.toThrow();
});
