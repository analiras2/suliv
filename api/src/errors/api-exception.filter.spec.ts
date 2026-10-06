import {
  ArgumentsHost,
  HttpException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiException } from './api-exception';
import { ApiExceptionFilter } from './api-exception.filter';

const HTTP_NOT_FOUND = 404;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TEAPOT = 418;
const HTTP_INTERNAL_ERROR = 500;

interface FakeRequest {
  method: string;
  route: { path: string };
  user?: { id: string };
}

function buildHost(request: FakeRequest) {
  const json = jest.fn<void, [Record<string, unknown>]>();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('ApiExceptionFilter', () => {
  const request: FakeRequest = {
    method: 'GET',
    route: { path: '/recipes/:slug' },
    user: { id: 'user-1' },
  };
  let filter: ApiExceptionFilter;
  let errorSpy: jest.SpyInstance<void, [unknown, ...unknown[]]>;
  let warnSpy: jest.SpyInstance<void, [unknown, ...unknown[]]>;

  beforeEach(() => {
    filter = new ApiExceptionFilter();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('UT-008 writes the contract body for an ApiException, without an error key', () => {
    const { host, status, json } = buildHost(request);

    filter.catch(
      new ApiException('RECIPE_NOT_FOUND', 'Recipe not found'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HTTP_NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: HTTP_NOT_FOUND,
      code: 'RECIPE_NOT_FOUND',
      message: 'Recipe not found',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('error');
  });

  it('UT-009 maps a non-coded NotFoundException to NOT_FOUND', () => {
    const { host, json } = buildHost(request);

    filter.catch(new NotFoundException(), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_NOT_FOUND,
        code: 'NOT_FOUND',
      }),
    );
  });

  it('UT-010 maps a guard UnauthorizedException to UNAUTHORIZED', () => {
    const { host, json } = buildHost(request);

    filter.catch(new UnauthorizedException(), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_UNAUTHORIZED,
        code: 'UNAUTHORIZED',
      }),
    );
  });

  it('UT-011 keeps the status of an unmapped 4xx and uses BAD_REQUEST', () => {
    const { host, status, json } = buildHost(request);

    filter.catch(new HttpException('Teapot', HTTP_TEAPOT), host);

    expect(status).toHaveBeenCalledWith(HTTP_TEAPOT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HTTP_TEAPOT, code: 'BAD_REQUEST' }),
    );
  });

  it('UT-012 hides the message and stack of a non-HTTP error', () => {
    const { host, status, json } = buildHost(request);

    filter.catch(new Error('connect ECONNREFUSED db:5432'), host);

    expect(status).toHaveBeenCalledWith(HTTP_INTERNAL_ERROR);
    const body = json.mock.calls[0][0];
    expect(body).toEqual({
      statusCode: HTTP_INTERNAL_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
  });

  it('UT-013 logs a non-HTTP error once at error level with the stack', () => {
    const { host } = buildHost(request);
    const failure = new Error('boom');

    filter.catch(failure, host);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [entry, stack] = errorSpy.mock.calls[0] as [string, string];
    expect(JSON.parse(entry)).toEqual({
      code: 'INTERNAL_ERROR',
      statusCode: HTTP_INTERNAL_ERROR,
      method: 'GET',
      route: '/recipes/:slug',
      userId: 'user-1',
    });
    expect(stack).toBe(failure.stack);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('UT-014 logs a 429 at warn level and does not log a handled 4xx', () => {
    const { host } = buildHost(request);

    filter.catch(
      new ApiException('COMMENT_RATE_LIMITED', 'Rate limit exceeded'),
      host,
    );
    filter.catch(
      new ApiException('RECIPE_NOT_FOUND', 'Recipe not found'),
      host,
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(warnSpy.mock.calls[0][0] as string)).toMatchObject({
      code: 'COMMENT_RATE_LIMITED',
      statusCode: 429,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
