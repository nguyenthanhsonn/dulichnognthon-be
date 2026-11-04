import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import {
  Global,
  type INestApplication,
  Module,
  ServiceUnavailableException,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DataSource, IsNull } from 'typeorm';
import pg from 'pg';
import request from 'supertest';
import { AuthModule } from '../src/modules/auth.module.js';
import { DatabaseModule } from '../src/database/database.module.js';
import { createDatabaseOptions } from '../src/database/database.config.js';
import { User, OtpCode, AuthSession } from '../src/modules/auth.model.js';
import { AUTH_SETTINGS, getAuthSettings } from '../src/services/auth.config.js';
import { ConfigService } from '@nestjs/config';
import { EMAIL_SENDER } from '../src/services/email/email-sender.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

const schema = `test_auth_${randomUUID().replaceAll('-', '')}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let database: DataSource;
let app: INestApplication;
let schemaCreated = false;
const settings = {
  ...getAuthSettings(
    new ConfigService({
      AUTH_JWT_SECRET: 'test-only-jwt-secret-at-least-32-characters',
      AUTH_OTP_SECRET: 'test-only-otp-secret-at-least-32-characters',
    }),
  ),
  otpCooldownSeconds: 60,
};
const delivered = new Map<string, string>();
const mail = {
  assertAvailable: () => {},
  sendOtp: vi.fn(async (email: string, code: string) => {
    delivered.set(email, code);
  }),
};
const email = () => `voter-${randomUUID()}@example.com`;

@Global()
@Module({
  providers: [{ provide: DataSource, useFactory: () => database }],
  exports: [DataSource],
})
class TestDatabaseModule {}

beforeAll(async () => {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  database = new DataSource(createDatabaseOptions(url.toString()));
  await database.initialize();
  await database.runMigrations();
  const module = await Test.createTestingModule({
    imports: [AuthModule],
    providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  })
    .overrideModule(DatabaseModule)
    .useModule(TestDatabaseModule)
    .overrideProvider(AUTH_SETTINGS)
    .useValue(settings)
    .overrideProvider(EMAIL_SENDER)
    .useValue(mail)
    // Kiểm tra IP throttling riêng; suite này kiểm tra khóa/limit email trong DB.
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();
  app = module.createNestApplication();
  await app.init();
});

afterAll(async () => {
  await app?.close();
  if (database?.isInitialized) await database.destroy();
  if (schemaCreated) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
});

async function send(number = email(), path = '/auth/otp/send') {
  const response = await request(app.getHttpServer())
    .post(path)
    .send({ email: number })
    .expect(202);
  return { number, code: delivered.get(number)!, response };
}

async function login() {
  const challenge = await send();
  const response = await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: challenge.number, otp: challenge.code })
    .expect(200);
  return { ...challenge, tokens: response.body };
}

it('normalizes email consistently for cooldown, verification and existing accounts', async () => {
  const address = email();
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: `  ${address.toUpperCase()}  ` })
    .expect(202);
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: address })
    .expect(409);
  const first = await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: address.toUpperCase(), otp: delivered.get(address) })
    .expect(200);
  await database
    .getRepository(OtpCode)
    .update({ email: address }, { createdAt: new Date(Date.now() - 61000) });
  await send(address);
  const second = await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: address, otp: delivered.get(address) })
    .expect(200);
  expect(second.body.user.id).toBe(first.body.user.id);
  expect(await database.getRepository(User).countBy({ email: address })).toBe(
    1,
  );
});

it('starts a fresh flow immediately after successful login/logout instead of blocking for one hour', async () => {
  const { number, tokens } = await login();
  const prior = await database
    .getRepository(OtpCode)
    .findOneByOrFail({ email: number });
  expect(prior.verifiedAt).not.toBeNull();
  await request(app.getHttpServer())
    .post('/auth/logout')
    .send({ refreshToken: tokens.refreshToken })
    .expect(204);
  const next = await send(number);
  expect(next.response.body.remainingResends).toBe(3);
  const latest = await database.getRepository(OtpCode).findOneOrFail({
    where: { email: number },
    order: { createdAt: 'DESC', id: 'DESC' },
  });
  expect(latest.flowId).not.toBe(prior.flowId);
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: number, otp: next.code })
    .expect(200)
    .expect((response) => {
      expect(response.body.user.id).toBe(tokens.user.id);
    });
  await request(app.getHttpServer())
    .post('/auth/otp/resend')
    .send({ email: number })
    .expect(400);
  await request(app.getHttpServer())
    .post('/auth/refresh')
    .send({ refreshToken: tokens.refreshToken })
    .expect(401);
});

it('closes a flow after three resends and verification, then gives the next flow three new resends', async () => {
  const { number } = await send();
  const first = await database
    .getRepository(OtpCode)
    .findOneByOrFail({ email: number });
  for (let i = 0; i < 3; i++) {
    await database
      .getRepository(OtpCode)
      .createQueryBuilder()
      .update()
      .set({ createdAt: () => "created_at - interval '61 seconds'" })
      .where({ email: number })
      .execute();
    const next = await send(number, '/auth/otp/resend');
    expect(next.response.body.remainingResends).toBe(2 - i);
  }
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: number, otp: delivered.get(number) })
    .expect(200);
  expect(
    await database
      .getRepository(OtpCode)
      .countBy({ flowId: first.flowId!, verifiedAt: IsNull() }),
  ).toBe(0);
  const next = await send(number);
  expect(next.response.body.remainingResends).toBe(3);
  expect(
    await database
      .getRepository(OtpCode)
      .countBy({ email: number, requestType: 'SEND' }),
  ).toBe(2);
});

it('keeps the hourly anti-spam budget across completed flows and restores it after the rolling hour', async () => {
  const { number } = await send();
  const now = new Date();
  await database
    .getRepository(OtpCode)
    .update({ email: number }, { verifiedAt: now, consumedAt: now });
  await database.getRepository(OtpCode).insert(
    Array.from({ length: settings.otpMaxPerHour - 1 }, () => ({
      email: number,
      requestType: 'SEND' as const,
      flowId: randomUUID(),
      flowExpiresAt: new Date(Date.now() + 1800000),
      codeHash: 'historical-hash',
      expiresAt: now,
      createdAt: new Date(Date.now() - 120000),
      verifiedAt: now,
      consumedAt: now,
    })),
  );
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: number })
    .expect(429);
  expect(await database.getRepository(OtpCode).countBy({ email: number })).toBe(
    settings.otpMaxPerHour,
  );
  await database
    .getRepository(OtpCode)
    .update({ email: number }, { createdAt: new Date(Date.now() - 3601000) });
  await send(number);
});

it('caps a resent code at the remaining flow lifetime and rejects an expired flow', async () => {
  const { number } = await send();
  await database.getRepository(OtpCode).update(
    { email: number },
    {
      createdAt: new Date(Date.now() - 61000),
      flowExpiresAt: new Date(Date.now() + 120000),
    },
  );
  const next = await send(number, '/auth/otp/resend');
  expect(next.response.body.expiresIn).toBeGreaterThan(0);
  expect(next.response.body.expiresIn).toBeLessThanOrEqual(120);
  await database
    .getRepository(OtpCode)
    .update(
      { email: number },
      { createdAt: new Date(Date.now() - 61000), flowExpiresAt: new Date(0) },
    );
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: number, otp: next.code })
    .expect(401);
  await request(app.getHttpServer())
    .post('/auth/otp/resend')
    .send({ email: number })
    .expect(400);
  await send(number);
});

it('sends a six-digit OTP, stores only its hash and creates no user until verification', async () => {
  const { number, code, response } = await send();
  expect(code).toMatch(/^\d{6}$/);
  expect(response.body).toMatchObject({
    expiresIn: 300,
    retryAfter: 60,
    remainingResends: 3,
    flowExpiresIn: 1800,
  });
  expect(response.body).not.toHaveProperty('otp');
  expect(response.headers['cache-control']).toBe('no-store');
  expect(await database.getRepository(User).countBy({ email: number })).toBe(0);
  const challenge = await database
    .getRepository(OtpCode)
    .findOneByOrFail({ email: number });
  expect(challenge.userId).toBeNull();
  expect(challenge.codeHash).toMatch(/^[0-9a-f]{64}$/);
  expect(challenge.codeHash).not.toBe(code);
  expect(challenge.expiresAt.getTime() - challenge.createdAt.getTime()).toBe(
    300000,
  );
});

it('logs in, returns safe user information and supports /auth/me', async () => {
  const { number, tokens } = await login();
  expect(tokens).toMatchObject({
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { email: number },
  });
  expect(tokens.user).not.toHaveProperty('isBlocked');
  const session = await database
    .getRepository(AuthSession)
    .findOneByOrFail({ id: tokens.refreshToken.split('.')[0] });
  expect(session.refreshTokenHash).not.toBe(tokens.refreshToken);
  expect(session.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
  const me = await request(app.getHttpServer())
    .get('/auth/me')
    .set('Authorization', `Bearer ${tokens.accessToken}`)
    .expect(200);
  expect(me.body).toEqual(tokens.user);
  await request(app.getHttpServer()).get('/auth/me').expect(401);
  await request(app.getHttpServer())
    .get('/auth/me')
    .set('Authorization', 'Bearer invalid')
    .expect(401);
});

it('commits wrong attempts and locks an OTP after exactly three failures', async () => {
  const { number, code } = await send();
  const wrong = code === '000000' ? '000001' : '000000';
  for (let attempt = 0; attempt < 3; attempt++) {
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ email: number, otp: wrong })
      .expect(401);
  }
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: number, otp: code })
    .expect(401);
  const challenge = await database
    .getRepository(OtpCode)
    .findOneByOrFail({ email: number });
  expect(challenge.attemptCount).toBe(3);
  expect(challenge.consumedAt).not.toBeNull();
  expect(await database.getRepository(User).countBy({ email: number })).toBe(0);
});

it('rejects expired OTPs', async () => {
  const { number, code } = await send();
  await database
    .getRepository(OtpCode)
    .update({ email: number }, { expiresAt: new Date(0) });
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: number, otp: code })
    .expect(401);
});

it('allows a code to be consumed only once under concurrent verification', async () => {
  const { number, code } = await send();
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ email: number, otp: code }),
    ),
  );
  expect(
    responses.map((result) => result.status).sort((a, b) => a - b),
  ).toEqual([200, 401]);
  expect(await database.getRepository(User).countBy({ email: number })).toBe(1);
});

it('serializes simultaneous sends and enforces the email cooldown', async () => {
  const number = email();
  const results = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ email: number }),
    ),
  );
  expect(results.map((result) => result.status).sort((a, b) => a - b)).toEqual([
    202, 409,
  ]);
  expect(await database.getRepository(OtpCode).countBy({ email: number })).toBe(
    1,
  );
});

it('allows one send and three resends per flow, rejects reset bypasses and expires abandoned flows', async () => {
  const { number } = await send();
  const first = await database
    .getRepository(OtpCode)
    .findOneByOrFail({ email: number });
  for (let i = 1; i < 4; i++) {
    await database
      .getRepository(OtpCode)
      .update({ email: number }, { createdAt: new Date(Date.now() - 61000) });
    await request(app.getHttpServer())
      .post('/auth/otp/resend')
      .send({ email: number })
      .expect(202);
  }
  await database
    .getRepository(OtpCode)
    .update({ email: number }, { createdAt: new Date(Date.now() - 61000) });
  await request(app.getHttpServer())
    .post('/auth/otp/resend')
    .send({ email: number })
    .expect(429);
  expect(
    await database
      .getRepository(OtpCode)
      .countBy({ email: number, requestType: 'SEND' }),
  ).toBe(1);
  expect(
    await database
      .getRepository(OtpCode)
      .countBy({ email: number, requestType: 'RESEND' }),
  ).toBe(3);
  expect(await database.getRepository(OtpCode).countBy({ email: number })).toBe(
    4,
  );
  expect(
    (await database.getRepository(OtpCode).findOneByOrFail({ id: first.id }))
      .consumedAt,
  ).not.toBeNull();
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: number })
    .expect(409);
  // Phiên bỏ dở hết hạn sau 30 phút: được bắt đầu phiên mới, không reset được trước đó.
  await database
    .getRepository(OtpCode)
    .update(
      { email: number },
      { createdAt: new Date(Date.now() - 1801000), flowExpiresAt: new Date(0) },
    );
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: number })
    .expect(202);
});

it('rejects resend before an initial send and refuses a second initial send after cooldown', async () => {
  const address = email();
  await request(app.getHttpServer())
    .post('/auth/otp/resend')
    .send({ email: address })
    .expect(400);
  expect(
    await database.getRepository(OtpCode).countBy({ email: address }),
  ).toBe(0);
  await send(address);
  await request(app.getHttpServer())
    .post('/auth/otp/resend')
    .send({ email: address })
    .expect(429);
  await database
    .getRepository(OtpCode)
    .update({ email: address }, { createdAt: new Date(Date.now() - 61000) });
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: address })
    .expect(409);
  expect(
    await database.getRepository(OtpCode).countBy({ email: address }),
  ).toBe(1);
  await send(address, '/auth/otp/resend');
});

it('allows only one final resend under concurrent requests and resets attempts on the new code', async () => {
  const { number } = await send();
  for (let i = 0; i < 2; i++) {
    await database
      .getRepository(OtpCode)
      .update({ email: number }, { createdAt: new Date(Date.now() - 61000) });
    await send(number, '/auth/otp/resend');
  }
  const previous = await database
    .getRepository(OtpCode)
    .findOneOrFail({ where: { email: number }, order: { createdAt: 'DESC' } });
  await database
    .getRepository(OtpCode)
    .update(previous.id, { attemptCount: 3, consumedAt: new Date() });
  await database
    .getRepository(OtpCode)
    .update({ email: number }, { createdAt: new Date(Date.now() - 61000) });
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/auth/otp/resend')
        .send({ email: number }),
    ),
  );
  expect(
    responses.map((result) => result.status).sort((a, b) => a - b),
  ).toEqual([202, 429]);
  expect(
    await database
      .getRepository(OtpCode)
      .countBy({ email: number, requestType: 'RESEND' }),
  ).toBe(3);
  const newest = await database
    .getRepository(OtpCode)
    .findOneOrFail({ where: { email: number }, order: { createdAt: 'DESC' } });
  expect(newest.attemptCount).toBe(0);
  expect(newest.id).not.toBe(previous.id);
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ email: number, otp: delivered.get(number) })
    .expect(200);
});

it('rotates refresh tokens once under concurrency, rejects reuse and revokes on logout', async () => {
  const { tokens } = await login();
  const results = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken }),
    ),
  );
  expect(results.map((result) => result.status).sort((a, b) => a - b)).toEqual([
    200, 401,
  ]);
  const rotated = results.find((result) => result.status === 200)!.body;
  expect(rotated.refreshToken).not.toBe(tokens.refreshToken);
  await request(app.getHttpServer())
    .post('/auth/refresh')
    .send({ refreshToken: tokens.refreshToken })
    .expect(401);
  await request(app.getHttpServer())
    .post('/auth/logout')
    .send({ refreshToken: rotated.refreshToken })
    .expect(204);
  await request(app.getHttpServer())
    .post('/auth/logout')
    .send({ refreshToken: rotated.refreshToken })
    .expect(204);
  await request(app.getHttpServer())
    .post('/auth/refresh')
    .send({ refreshToken: rotated.refreshToken })
    .expect(401);
  await request(app.getHttpServer())
    .get('/auth/me')
    .set('Authorization', `Bearer ${rotated.accessToken}`)
    .expect(401);
});

it('rejects expired sessions and expired access tokens', async () => {
  const { tokens } = await login();
  const jwt = new JwtService();
  const expired = await jwt.signAsync(
    {
      sub: tokens.user.id,
      sid: tokens.refreshToken.split('.')[0],
      type: 'access',
    },
    {
      secret: settings.jwtSecret,
      issuer: settings.issuer,
      audience: settings.audience,
      algorithm: 'HS256',
      expiresIn: -1,
    },
  );
  await request(app.getHttpServer())
    .get('/auth/me')
    .set('Authorization', `Bearer ${expired}`)
    .expect(401);
  await database
    .getRepository(AuthSession)
    .update(tokens.refreshToken.split('.')[0], { expiresAt: new Date(0) });
  await request(app.getHttpServer())
    .post('/auth/refresh')
    .send({ refreshToken: tokens.refreshToken })
    .expect(401);
});

it('rejects access and refresh for a blocked user', async () => {
  const { tokens } = await login();
  await database
    .getRepository(User)
    .update(tokens.user.id, { isBlocked: true });
  await request(app.getHttpServer())
    .get('/auth/me')
    .set('Authorization', `Bearer ${tokens.accessToken}`)
    .expect(401);
  await request(app.getHttpServer())
    .post('/auth/refresh')
    .send({ refreshToken: tokens.refreshToken })
    .expect(401);
});

it('consumes a challenge if the email provider fails', async () => {
  const number = email();
  mail.sendOtp.mockRejectedValueOnce(
    new ServiceUnavailableException('email unavailable'),
  );
  await request(app.getHttpServer())
    .post('/auth/otp/send')
    .send({ email: number })
    .expect(503);
  expect(
    (await database.getRepository(OtpCode).findOneByOrFail({ email: number }))
      .consumedAt,
  ).not.toBeNull();
});
