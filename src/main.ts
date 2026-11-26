import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { otpCors } from './common/otp-cors.js';
import { configuredVotingReopening } from './common/contest-deadline.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
  }
  app.set('trust proxy', proxyHops);
  app.enableCors(otpCors);
  app.enableShutdownHooks();
  const reopening = configuredVotingReopening();
  if (reopening.endsAt > Date.now()) {
    await app.get(DataSource).query(
      `INSERT INTO contest_voting_reopenings (starts_at, ends_at)
       VALUES ($1, $2)
       ON CONFLICT (starts_at) DO UPDATE SET ends_at = EXCLUDED.ends_at
       WHERE contest_voting_reopenings.ends_at IS DISTINCT FROM EXCLUDED.ends_at`,
      [new Date(reopening.startsAt), new Date(reopening.endsAt)],
    );
  }
  // Render cấp PORT qua môi trường; local dùng giá trị PORT trong .env.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
