import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {View} from 'react-native';
import {RootStackParamList} from 'src/@types/navigation';
import {Typography} from 'src/components';
import BaseScreen from 'src/components/baseScreen';
import {StackNames} from 'src/navigation/stacks';

import React from 'react';

type FavoritesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.FAVORITES
>;

type Props = {
  navigation: FavoritesScreenNavigationProp;
};

const FavoritesScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();

  return (
    <BaseScreen header={{title: t('favorites.title')}}>
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
        onPress={() => navigation.navigate(StackNames.FAVORITES)}
        variant="link"
        size="sm"
        justifyContent="flex-start">
        {t('login.forgotPassword')}
      </Button>
      <View style={{flex: 1}} />
      <Button
        disabled
        mb={theme.space['1.5']}
        onPress={() => navigation.navigate(StackNames.FAVORITES)}>
        {t('goIn')}
      </Button>
      <Button
        onPress={() => navigation.navigate(StackNames.FAVORITES)}
        variant="link"
        mb={5}
        size="sm">
        {t('login.register')}
      </Button>
    </BaseScreen>
  );
};

export default FavoritesScreen;
