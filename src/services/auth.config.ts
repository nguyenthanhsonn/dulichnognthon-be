import type { ConfigService } from '@nestjs/config';

export const AUTH_SETTINGS = Symbol('AUTH_SETTINGS');
export type AuthSettings = ReturnType<typeof getAuthSettings>;

export function getAuthSettings(config: ConfigService) {
  const secret = (name: string): string => {
    const value = config.get<string>(name);
    if (!value || value.length < 32)
      throw new Error(`${name} must contain at least 32 characters.`);
    return value;
  };
  const integer = (name: string, fallback: number, max: number): number => {
    const value = Number(config.get<string>(name) || fallback);
    if (!Number.isInteger(value) || value < 1 || value > max)
      throw new Error(`${name} must be between 1 and ${max}.`);
    return value;
  };
  return {
    jwtSecret: secret('AUTH_JWT_SECRET'),
    otpSecret: secret('AUTH_OTP_SECRET'),
    issuer: 'dulichnongthon-api',
    audience: 'dulichnongthon-web',
    accessTtlSeconds: 15 * 60,
    refreshTtlSeconds: 30 * 24 * 60 * 60,
    otpTtlSeconds: integer('OTP_EXPIRES_SECONDS', 300, 300),
    otpMaxAttempts: integer('OTP_MAX_ATTEMPTS', 3, 3),
    otpCooldownSeconds: integer('OTP_SEND_COOLDOWN_SECONDS', 60, 3600),
    // Quota chống spam độc lập với quota gửi lại của từng phiên xác thực.
    otpMaxPerHour: integer('OTP_MAX_SENDS_PER_HOUR', 10, 20),
    otpFlowTtlSeconds: 30 * 60,
    otpMaxResends: 3,
  };
}
