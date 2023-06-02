import React from 'react';
import {Box, Text} from 'native-base';
import {useTranslation} from 'react-i18next';

const FavoritesScreen = () => {
  const {t} = useTranslation();

  return (
    <Box p={5}>
      <Text>{t('favorites.title')}</Text>
    </Box>
  );
};

export default FavoritesScreen;
