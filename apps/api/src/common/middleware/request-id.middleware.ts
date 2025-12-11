import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Get or generate request ID
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();

    // Attach to request for use in other parts of the app
    (req as Request & { id: string }).id = requestId;

    // Add to response headers for client tracking
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    // Log request start
    this.logger.log(`[${requestId}] ${method} ${originalUrl} - IP: ${ip}`);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const logLevel =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      this.logger[logLevel](
        `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
