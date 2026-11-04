import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '../src/controllers/auth.controller.js';
import { AuthService } from '../src/services/auth.service.js';
import { AccessTokenGuard } from '../src/guards/access-token.guard.js';

describe('Auth request validation and IP throttling', () => {
  let app: INestApplication;
  const auth = { sendOtp: vi.fn(async () => ({ message: 'OTP sent' })) };

  beforeEach(async () => {
    auth.sendOtp.mockClear();
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }, AccessTokenGuard],
    }).compile();
    app = module.createNestApplication();
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

  it('rejects invalid emails, unexpected fields and non-string OTPs', async () => {
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

  it('limits send requests by IP even for different email addresses', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ email: `voter${i}@example.com` })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ email: 'another@example.com' })
      .expect(429);
    expect(auth.sendOtp).toHaveBeenCalledTimes(5);
  });
});
