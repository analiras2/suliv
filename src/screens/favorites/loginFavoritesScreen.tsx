import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {BaseScreen, Header, TextInput, Typography} from 'src/components';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.FAVORITES>;

const LoginFavoritesScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();

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
      <TextInput mt={8} mb={4} placeholder={t('login.email')} />
      <TextInput mb={4} placeholder={t('login.password')} />
      <Button
        mb={8}
        onPress={() => {}}
        variant="link"
        size="sm"
        justifyContent="flex-start">
        {t('login.forgotPassword')}
      </Button>
      <Button>{t('login.enter')}</Button>
      <Button
        mt={8}
        onPress={() => navigation.navigate(StackRoutes.SING_UP)}
        variant="link"
        size="sm">
        {t('login.singUp')}
      </Button>
    </BaseScreen>
  );
};

export default LoginFavoritesScreen;
