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

  it('normalizes Vietnamese phone numbers before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '090 123 4567' })
      .expect(202);
    expect(auth.sendOtp).toHaveBeenCalledWith('+84901234567');
  });

  it('rejects invalid phones, unexpected fields and non-string OTPs', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '123' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '+84901234567', isAdmin: true })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '+84901234567', otp: 123456 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '+84901234567', otp: '12345' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid' })
      .expect(400);
    expect(auth.sendOtp).not.toHaveBeenCalled();
  });

  it('limits send requests by IP even for different phone numbers', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phone: `+8490123456${i}` })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '+84901234569' })
      .expect(429);
    expect(auth.sendOtp).toHaveBeenCalledTimes(5);
  });
});
