import {Text} from 'native-base';
import {useTranslation} from 'react-i18next';
import BaseScreen from 'src/components/baseScreen';

import React from 'react';

const FavoritesScreen = () => {
  const {t} = useTranslation();

  return (
    <BaseScreen>
      <Text>{t('favorites.title')}</Text>
    </BaseScreen>
  );
};

export default FavoritesScreen;
