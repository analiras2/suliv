import { HttpException } from '@nestjs/common';
import {
  API_ERRORS,
  type ApiErrorCode,
  type ValidationIssue,
} from '@suliv/error-codes';

/**
 * The only exception services throw. Its HTTP status always comes from the
 * catalog entry of its code, so a code can never be served with another status.
 */
export class ApiException extends HttpException {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ValidationIssue[],
  ) {
    super({ code, message, details }, API_ERRORS[code].status);
  }
}
