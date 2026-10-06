import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody, ApiErrorCode } from '@suliv/error-codes';
import type { Request, Response } from 'express';
import { ApiException } from './api-exception';

const INTERNAL_ERROR_MESSAGE = 'Internal server error';
const SERVER_ERROR_STATUS_MIN = 500;
const RATE_LIMITED_STATUS: number = HttpStatus.TOO_MANY_REQUESTS;

const GENERIC_CODE_BY_STATUS: Readonly<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

const GENERIC_MESSAGE_BY_CODE: Readonly<Partial<Record<ApiErrorCode, string>>> =
  {
    VALIDATION_FAILED: 'Request validation failed',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Not found',
    CONFLICT: 'Conflict',
    UNPROCESSABLE: 'Unprocessable request',
    RATE_LIMITED: 'Too many requests',
    BAD_REQUEST: 'Bad request',
  };

interface RequestWithUser extends Request {
  user?: { id?: string };
}

/**
 * Normalizes every error into `ApiErrorBody` (ADR-001, ADR-007): coded
 * exceptions pass through, framework `HttpException`s get a generic code by
 * status and anything else becomes `500 INTERNAL_ERROR` without leaking
 * its message or stack.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();
    const body = this.buildBody(exception);

    this.log(exception, body, request);
    response.status(body.statusCode).json(body);
  }

  private buildBody(exception: unknown): ApiErrorBody {
    if (exception instanceof ApiException) {
      const body: ApiErrorBody = {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
      };
      return exception.details ? { ...body, details: exception.details } : body;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const code = GENERIC_CODE_BY_STATUS[statusCode] ?? 'BAD_REQUEST';
      return {
        statusCode,
        code: statusCode >= SERVER_ERROR_STATUS_MIN ? 'INTERNAL_ERROR' : code,
        message:
          statusCode >= SERVER_ERROR_STATUS_MIN
            ? INTERNAL_ERROR_MESSAGE
            : (GENERIC_MESSAGE_BY_CODE[code] ?? 'Bad request'),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: INTERNAL_ERROR_MESSAGE,
    };
  }

  private log(
    exception: unknown,
    body: ApiErrorBody,
    request: RequestWithUser,
  ): void {
    const isServerError = body.statusCode >= SERVER_ERROR_STATUS_MIN;
    const isRateLimited = body.statusCode === RATE_LIMITED_STATUS;
    if (!isServerError && !isRateLimited) {
      return;
    }

    const entry = JSON.stringify({
      code: body.code,
      statusCode: body.statusCode,
      method: request.method,
      route: (request.route as { path?: string } | undefined)?.path,
      userId: request.user?.id,
    });

    if (isServerError) {
      this.logger.error(
        entry,
        exception instanceof Error ? exception.stack : undefined,
      );
      return;
    }
    this.logger.warn(entry);
  }
}
