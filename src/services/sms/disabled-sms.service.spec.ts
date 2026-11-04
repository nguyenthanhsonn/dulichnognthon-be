import { JwtService } from '@nestjs/jwt';
import { type DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service.js';
import { getAuthSettings } from '../auth.config.js';
import { DisabledSmsService } from './disabled-sms.service.js';

it('rejects OTP sends before creating a challenge when SMS integration is deferred', async () => {
  const transaction = vi.fn();
  const settings = getAuthSettings(
    new ConfigService({
      AUTH_JWT_SECRET: 'test-jwt-secret-with-at-least-32-characters',
      AUTH_OTP_SECRET: 'test-otp-secret-with-at-least-32-characters',
    }),
  );
  const auth = new AuthService(
    { transaction } as unknown as DataSource,
    new JwtService(),
    settings,
    new DisabledSmsService(),
  );
  await expect(auth.sendOtp('+84901234567')).rejects.toMatchObject({
    status: 503,
  });
  expect(transaction).not.toHaveBeenCalled();
});
