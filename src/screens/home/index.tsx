import {useTranslation} from 'react-i18next';
import {BaseScreen, TYPE, Typography} from 'src/components';

import React from 'react';

const HomeScreen = () => {
  const {t} = useTranslation();

  return (
    <BaseScreen header={{showLogo: true}}>
      <Typography mb={5} type={TYPE.TITLE}>
        {t('home.popular')}
      </Typography>
      <Typography mb={5} type={TYPE.TITLE}>
        {t('home.recent')}
      </Typography>
    </BaseScreen>
  );
};

export default HomeScreen;
