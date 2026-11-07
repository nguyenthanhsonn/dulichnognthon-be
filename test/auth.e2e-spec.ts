import {
  type INestApplication,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '../src/controllers/auth.controller.js';
import { AuthService } from '../src/services/auth.service.js';
import { AccessTokenGuard } from '../src/guards/access-token.guard.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Auth request validation and IP throttling', () => {
  let app: INestApplication;
  const auth = {
    sendOtp: vi.fn(async () => ({ message: 'OTP sent' })),
    resendOtp: vi.fn(async () => ({ message: 'OTP sent' })),
    verifyOtp: vi.fn(async () => ({ message: 'Verified' })),
  };

  beforeEach(async () => {
    auth.sendOtp.mockClear();
    auth.resendOtp.mockClear();
    auth.verifyOtp.mockClear();
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }, AccessTokenGuard],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  it('normalizes email addresses before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ email: '  Voter@Example.COM  ' })
      .expect(202);
    expect(auth.sendOtp).toHaveBeenCalledWith('voter@example.com');
  });

  it('returns a safe Vietnamese message when OTP delivery is unavailable', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    auth.sendOtp.mockRejectedValueOnce(
      new ServiceUnavailableException('private upstream credentials'),
    );
    try {
      const response = await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ email: 'voter@example.com' })
        .expect(503);
      expect(response.body.message).toBe(
        'Không thể gửi mã OTP lúc này. Vui lòng thử lại sau.',
      );
      expect(JSON.stringify(response.body)).not.toContain('private');
    } finally {
      log.mockRestore();
    }
  });

  it('rejects invalid emails, unexpected fields and non-string OTPs', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/resend')
      .send({ email: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/resend')
      .send({ email: 'voter@example.com', requestType: 'SEND' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ email: 'not-an-email' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ email: 'voter@example.com', isAdmin: true })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ email: 'voter@example.com', otp: 123456 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ email: 'voter@example.com', otp: '12345' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid' })
      .expect(400);
    expect(auth.sendOtp).not.toHaveBeenCalled();
  });

  it('routes normalized resend requests to the dedicated service method', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/otp/resend')
      .send({ email: '  Voter@Example.COM  ' })
      .expect(202);
    expect(auth.resendOtp).toHaveBeenCalledWith('voter@example.com');
    expect(auth.sendOtp).not.toHaveBeenCalled();
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('shares the IP sending limit between send and resend endpoints', async () => {
    for (let i = 0; i < 60; i++) {
      await request(app.getHttpServer())
        .post(i % 2 ? '/auth/otp/resend' : '/auth/otp/send')
        .send({ email: `voter${i}@example.com` })
        .expect(202);
    }
    const blocked = await request(app.getHttpServer())
      .post('/auth/otp/resend')
      .send({ email: 'next@example.com' })
      .expect(429);
    expect(blocked.body.message).toContain('Có nhiều yêu cầu từ mạng của bạn');
    expect(blocked.body.message).not.toContain('ThrottlerException');
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ email: 'next@example.com' })
      .expect(429);
    expect(
      auth.sendOtp.mock.calls.length + auth.resendOtp.mock.calls.length,
    ).toBe(60);
  });

  it('limits send requests by IP even for different email addresses', async () => {
    for (let i = 0; i < 60; i++) {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ email: `voter${i}@example.com` })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ email: 'another@example.com' })
      .expect(429);
    expect(auth.sendOtp).toHaveBeenCalledTimes(60);
  });

  it('allows more than five voters and fifteen verifications on the same Wi-Fi', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ email: `voter${i}@example.com` })
        .expect(202);
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ email: `voter${i}@example.com`, otp: '123456' })
        .expect(200);
    }
    expect(auth.sendOtp).toHaveBeenCalledTimes(20);
    expect(auth.verifyOtp).toHaveBeenCalledTimes(20);
  });

  it('separates client IPs behind a trusted single-hop proxy', async () => {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    for (let i = 0; i < 60; i++) {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .set('X-Forwarded-For', '203.0.113.1')
        .send({ email: `voter${i}@example.com` })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .set('X-Forwarded-For', '203.0.113.1')
      .send({ email: 'blocked@example.com' })
      .expect(429);
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .set('X-Forwarded-For', '203.0.113.2')
      .send({ email: 'new@example.com' })
      .expect(202);
  });

  it('does not let untrusted forwarded headers bypass the IP limit', async () => {
    for (let i = 0; i < 60; i++) {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .set('X-Forwarded-For', `203.0.113.${i + 1}`)
        .send({ email: `voter${i}@example.com` })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .set('X-Forwarded-For', '203.0.113.200')
      .send({ email: 'blocked@example.com' })
      .expect(429);
  });
});
