import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const defaultNS = 'en'; // TODO: get mobile language || 'en'

AsyncStorage.getItem('language').then(language => {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    lng: language || defaultNS,
    fallbackLng: defaultNS,
    resources,
  });
});

export default i18n;
