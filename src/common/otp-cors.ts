import type { CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import type { Request } from 'express';

const otpPaths = /^\/auth\/otp\/(send|resend|verify)\/?$/;

export const otpCors: CorsOptionsDelegate<Request> = (request, callback) => {
  if (!otpPaths.test(request.path)) {
    callback(null, { origin: false });
    return;
  }

  callback(null, {
    origin: ['https://www.dulichnongthon.vn', 'https://dulichnongthon.vn'],
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Retry-After', 'X-Request-Id'],
  });
};
