import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {BaseScreen, FlexView, Header, Typography} from 'src/components';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.FAVORITES>;

const LoginFavoritesScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();

  return (
    <BaseScreen
      id={route.name}
      header={{type: Header.TYPE.NAV, title: t('favorites.title')}}>
      <Typography>{t('favorites.register')}</Typography>
      <Typography mb={4} alignSelf="center">
        Google
      </Typography>
      <Typography mb={4} alignSelf="center">
        Apple
      </Typography>
      <Typography mb={4} alignSelf="center">
        {t('register.email')}
      </Typography>
      <Typography mb={4} alignSelf="center">
        {t('register.password')}
      </Typography>
      <Button
        onPress={() => navigation.navigate(StackRoutes.FAVORITES)}
        variant="link"
        size="sm"
        justifyContent="flex-start">
        {t('login.forgotPassword')}
      </Button>
      <FlexView />
      <Button
        mb={theme.space['1.5']}
        onPress={() => navigation.navigate(StackRoutes.FAVORITES)}>
        {t('goIn')}
      </Button>
      <Button
        onPress={() => navigation.navigate(StackRoutes.FAVORITES)}
        variant="link"
        mb={5}
        size="sm">
        {t('login.register')}
      </Button>
    </BaseScreen>
  );
};

export default LoginFavoritesScreen;
