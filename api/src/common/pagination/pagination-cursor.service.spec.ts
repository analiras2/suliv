import { ConfigService } from '@nestjs/config';
import { ApiException } from '../../errors/api-exception';
import { PaginationCursorService } from './pagination-cursor.service';

function createService(secret = 'test-secret') {
  const config = {
    getOrThrow: jest.fn().mockReturnValue(secret),
  } as unknown as ConfigService;
  return new PaginationCursorService(config);
}

describe('PaginationCursorService', () => {
  // UT-001
  it('round-trips a payload through encode and decode', () => {
    const service = createService();
    const payload = { sortValue: '2026-10-06T12:00:00.000Z', id: 'recipe-1' };

    expect(service.decode(service.encode(payload))).toEqual(payload);
  });

  it('supports numeric sort values such as a computed score', () => {
    const service = createService();
    const payload = { sortValue: 42.5, id: 'recipe-2' };

    expect(service.decode(service.encode(payload))).toEqual(payload);
  });

  // UT-002
  it.each(['', 'not-a-cursor', '...', 'abc.def.ghi', '%%%.%%%'])(
    'returns null for the malformed cursor %p',
    (cursor) => {
      expect(createService().decode(cursor)).toBeNull();
    },
  );

  // UT-003
  it('returns null when the payload was edited after signing', () => {
    const service = createService();
    const [, signature] = service
      .encode({ sortValue: 1, id: 'recipe-1' })
      .split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ sortValue: 999, id: 'recipe-1' }),
    ).toString('base64');

    expect(service.decode(`${forgedBody}.${signature}`)).toBeNull();
  });

  it('returns null for a cursor signed with another secret', () => {
    const cursor = createService('secret-a').encode({ sortValue: 1, id: 'x' });

    expect(createService('secret-b').decode(cursor)).toBeNull();
  });

  it('maps an invalid cursor to a BAD_REQUEST ApiException', () => {
    expect(() => createService().decodeOrThrow('garbage')).toThrow(
      ApiException,
    );
  });
});
