import { Injectable, type NestMiddleware } from '@nestjs/common';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import { constants } from 'node:zlib';

/** Compress only public ranking SSE; sync flush delivers each frame immediately. */
@Injectable()
export class RankingStreamCompressionMiddleware implements NestMiddleware {
  private readonly compress = compression({
    threshold: 0,
    level: 6,
    flush: constants.Z_SYNC_FLUSH,
    brotli: { flush: constants.BROTLI_OPERATION_FLUSH },
    filter: (_request, response) => {
      if (
        !String(response.getHeader('Content-Type')).startsWith(
          'text/event-stream',
        )
      )
        return false;
      // Nest sets no-transform when opening SSE. We own this public stream and
      // explicitly allow its compression, while retaining all no-cache controls.
      response.setHeader(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate, max-age=0',
      );
      return true;
    },
  });

  use(request: Request, response: Response, next: NextFunction): void {
    this.compress(request, response, next);
  }
}
