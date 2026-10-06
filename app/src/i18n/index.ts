import { createInstance, type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import auth from './locales/pt-BR/auth.json';
import common from './locales/pt-BR/common.json';
import recipes from './locales/pt-BR/recipes.json';

export const DEFAULT_LOCALE = 'pt-BR';
export const DEFAULT_NAMESPACE = 'common';

export const resources = {
  [DEFAULT_LOCALE]: { auth, common, recipes },
} as const;

/**
 * Creates an i18next instance with every namespace loaded eagerly: the MVP ships a single
 * locale, so there is nothing to lazy-load. Tests build their own instance with this.
 */
export function createI18n(): I18nInstance {
  const instance = createInstance();
  instance.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: DEFAULT_NAMESPACE,
    ns: Object.keys(resources[DEFAULT_LOCALE]),
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return instance;
}

export const i18n = createI18n();
