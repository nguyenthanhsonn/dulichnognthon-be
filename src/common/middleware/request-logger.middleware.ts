import { randomUUID } from 'node:crypto';
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { HttpRequest } from '../types/http-request.js';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: HttpRequest, response: Response, next: NextFunction): void {
    const requestId = randomUUID();
    const startedAt = performance.now();
    const { method } = request;
    // Express may strip a mounted middleware's path to '/'. Never include query
    // parameters, which can contain email addresses or authentication material.
    const path = (request.originalUrl || request.path).split('?')[0];

    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    response.once('finish', () => {
      const durationMs = (performance.now() - startedAt).toFixed(1);
      this.logger.log(
        `${method} ${path} ${response.statusCode} ${durationMs}ms contentLength=${String(response.getHeader('Content-Length') ?? 'stream')} requestId=${requestId}`,
      );
    });

    next();
  }
}
