import { describe, expect, it } from '@jest/globals';

import { createI18n } from './index';

describe('i18n', () => {
  const i18n = createI18n();

  // UT-010
  it('resolves the singular and plural forms of a counted key', () => {
    expect(i18n.t('common:recipes_count', { count: 1 })).toBe('1 receita');
    expect(i18n.t('common:recipes_count', { count: 5 })).toBe('5 receitas');
  });

  // UT-011
  it('interpolates values into a key', () => {
    expect(i18n.t('auth:greeting', { name: 'Ana' })).toBe('Olá, Ana!');
  });

  it('uses the common namespace by default', () => {
    expect(i18n.t('retry')).toBe('Tentar de novo');
  });
});
