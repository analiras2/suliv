import React from 'react';
import {Box, Text} from 'native-base';
import {useTranslation} from 'react-i18next';

const HomeScreen = () => {
  const {t} = useTranslation();

  return (
    <Box safeArea p={5}>
      <Text>{t('appName')}</Text>
    </Box>
  );
};

export default HomeScreen;
