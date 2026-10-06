import { ApiException } from './api-exception';

describe('ApiException', () => {
  it('UT-006 takes its status from the catalog entry of its code', () => {
    const exception = new ApiException(
      'USERNAME_TAKEN',
      'Username is already taken',
    );

    expect(exception.getStatus()).toBe(409);
    expect(exception.getResponse()).toEqual({
      code: 'USERNAME_TAKEN',
      message: 'Username is already taken',
    });
  });

  it('UT-007 carries validation details in its response', () => {
    const details = [{ field: 'email', constraint: 'isEmail' }];

    const exception = new ApiException(
      'VALIDATION_FAILED',
      'Request validation failed',
      details,
    );

    expect(exception.getStatus()).toBe(400);
    expect((exception.getResponse() as { details: unknown }).details).toEqual(
      details,
    );
  });
});
