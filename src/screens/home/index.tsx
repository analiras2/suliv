import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Text} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import BaseScreen from 'src/components/baseScreen';
import {StackNames} from 'src/navigation/stacks';

import React from 'react';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.HOME
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen = ({navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen>
      <Text mb={5}>{t('appName')}</Text>
      <Button onPress={() => navigation.navigate(StackNames.FAVORITES)}>
        {t('favorites.title')}
      </Button>
    </BaseScreen>
  );
};

export default HomeScreen;
