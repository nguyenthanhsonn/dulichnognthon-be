import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import type { HttpRequest } from '../types/http-request.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<HttpRequest>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = STATUS_CODES[statusCode] ?? 'Error';

    if (exception instanceof HttpException && statusCode < 500) {
      const body = exception.getResponse();
      message = exception.message;

      if (typeof body === 'string') {
        message = body;
      } else {
        if (
          'message' in body &&
          (typeof body.message === 'string' ||
            (Array.isArray(body.message) &&
              body.message.every((item: unknown) => typeof item === 'string')))
        ) {
          message = body.message as string | string[];
        }
        if ('error' in body && typeof body.error === 'string') {
          error = body.error;
        }
      }
    }

    if (exception instanceof ThrottlerException) {
      message =
        'Có nhiều yêu cầu từ mạng của bạn. Vui lòng chờ một phút rồi thử lại.';
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.path} ${statusCode} requestId=${request.requestId ?? 'unknown'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (response.headersSent) {
      return;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: request.path,
      timestamp: new Date().toISOString(),
      requestId: request.requestId,
    });
  }
}
