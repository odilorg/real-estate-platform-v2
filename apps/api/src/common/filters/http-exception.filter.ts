import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const requestId = request.id;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : (message as { message?: string }).message ||
            JSON.stringify(message),
      error:
        exception instanceof HttpException
          ? exception.message
          : 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // Log error details with request ID
    const logPrefix = requestId ? `[${requestId}] ` : '';
    if (status >= 500) {
      this.logger.error(
        `${logPrefix}${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else {
      this.logger.warn(
        `${logPrefix}${request.method} ${request.url} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
