import {Text} from 'native-base';
import {useTranslation} from 'react-i18next';

import React from 'react';

import BaseScreen from '../baseScreen';

const FavoritesScreen = () => {
  const {t} = useTranslation();

  return (
    <BaseScreen>
      <Text>{t('favorites.title')}</Text>
    </BaseScreen>
  );
};

export default FavoritesScreen;
