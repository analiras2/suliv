import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import en from './en.json';
import es from './es.json';
import pt from './pt.json';

export const resources = {
  en: en,
  es: es,
  pt: pt,
};

export const defaultNS = 'pt';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
  },
  lng: 'pt',
  resources,
});

export default i18n;
