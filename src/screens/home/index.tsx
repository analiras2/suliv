import {useTranslation} from 'react-i18next';
import {BaseScreen, TYPE, Typography} from 'src/components';

import React from 'react';

const HomeScreen = () => {
  const {t} = useTranslation();

  return (
    <BaseScreen header={{showLogo: true}}>
      <Typography type={TYPE.TITLE}>{t('home.popular')}</Typography>
      {/* TODO: lista de receitas */}
      <Typography type={TYPE.TITLE}>{t('home.recent')}</Typography>
      {/* TODO: lista de receitas */}
    </BaseScreen>
  );
};

export default HomeScreen;
