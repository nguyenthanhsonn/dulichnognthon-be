import { ConfigService } from '@nestjs/config';
import { getAuthSettings } from './auth.config.js';

const secrets = {
  AUTH_JWT_SECRET: 'jwt-test-secret-with-at-least-32-characters',
  AUTH_OTP_SECRET: 'otp-test-secret-with-at-least-32-characters',
};

describe('Auth configuration', () => {
  it('uses short access tokens, five-minute OTPs and three attempts', () => {
    expect(getAuthSettings(new ConfigService(secrets))).toMatchObject({
      accessTtlSeconds: 900,
      otpTtlSeconds: 300,
      otpMaxAttempts: 3,
      otpCooldownSeconds: 60,
      otpMaxPerHour: 5,
    });
  });
  it.each([
    { AUTH_JWT_SECRET: 'short' },
    { AUTH_OTP_SECRET: '' },
    { OTP_MAX_ATTEMPTS: '4' },
    { OTP_EXPIRES_SECONDS: '301' },
    { OTP_SEND_COOLDOWN_SECONDS: '0' },
    { OTP_MAX_SENDS_PER_HOUR: 'NaN' },
  ])('rejects unsafe configuration: %j', (value) => {
    expect(() =>
      getAuthSettings(new ConfigService({ ...secrets, ...value })),
    ).toThrow();
  });
});
