import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
  }
  app.set('trust proxy', proxyHops);
  app.enableShutdownHooks();
  // Render cấp PORT qua môi trường; local dùng giá trị PORT trong .env.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
