import { ValidationPipe } from '@nestjs/common';
import type { ValidationIssue } from '@suliv/error-codes';
import type { ValidationError } from 'class-validator';
import { ApiException } from './api-exception';

const VALIDATION_FAILED_MESSAGE = 'Request validation failed';
const PATH_SEPARATOR = '.';

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationIssue[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}${PATH_SEPARATOR}${error.property}`
      : error.property;
    const ownIssues = Object.keys(error.constraints ?? {}).map(
      (constraint) => ({
        field,
        constraint,
      }),
    );
    return [
      ...ownIssues,
      ...flattenValidationErrors(error.children ?? [], field),
    ];
  });
}

/** Builds the `VALIDATION_FAILED` exception without echoing values or constraint parameters (ADR-003). */
export function validationExceptionFactory(
  errors: ValidationError[],
): ApiException {
  return new ApiException(
    'VALIDATION_FAILED',
    VALIDATION_FAILED_MESSAGE,
    flattenValidationErrors(errors),
  );
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    forbidNonWhitelisted: true,
    whitelist: true,
    exceptionFactory: validationExceptionFactory,
  });
}
