import { buildCorsOptions } from './cors';

describe('buildCorsOptions', () => {
  it('keeps CORS disabled when no origin is configured', () => {
    expect(buildCorsOptions(undefined)).toBeNull();
    expect(buildCorsOptions('')).toBeNull();
    expect(buildCorsOptions(' , ')).toBeNull();
  });

  it('allows only the listed origins, trimmed, without credentials', () => {
    expect(
      buildCorsOptions('http://localhost:8081, https://app.suliv.app '),
    ).toEqual({
      origin: ['http://localhost:8081', 'https://app.suliv.app'],
      credentials: false,
    });
  });
});
