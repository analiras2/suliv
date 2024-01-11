import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';

import React, {createContext, useContext, useEffect, useState} from 'react';

const STORAGE_KEY_LANGUAGE = '@languade';

export enum LANGUAGES {
  PT = 'pt',
  EN = 'en',
  ES = 'es',
}

export const AppContext = createContext<{
  language: LANGUAGES;
  setLanguage: (Language: LANGUAGES) => void;
}>({
  language: LANGUAGES.PT,
  setLanguage: () => {},
});

export const useAppState = () => {
  return useContext(AppContext);
};

export const AppProvider = ({
  children,
  i18n,
}: {
  children: React.ReactNode;
  i18n: typeof i18next;
}) => {
  const [language, setLanguage] = useState<LANGUAGES>(LANGUAGES.PT);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
        if (savedLanguage) {
          setLanguage(savedLanguage as LANGUAGES);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  useEffect(() => {
    const saveLanguage = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, language);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    };
    i18n?.changeLanguage(language);
    saveLanguage();
  }, [i18n, language]);

  return (
    <AppContext.Provider value={{language, setLanguage}}>
      {children}
    </AppContext.Provider>
  );
};
