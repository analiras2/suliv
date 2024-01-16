import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from 'native-base';
import {useTranslation} from 'react-i18next';
import {StackRoutes} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

import * as St from './styles';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.PROFILE>;

const LoginScreen = ({navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <St.Image source={require('src/assets/imgs/bg.png')} resizeMode="cover">
      <Button mx={4} onPress={() => navigation.navigate(StackRoutes.EMAIL)}>
        {t('login.withEmail')}
      </Button>
      <Button
        mb={8}
        onPress={() => navigation.navigate(StackRoutes.SING_UP)}
        variant="link"
        size="sm">
        {t('login.singUp')}
      </Button>
    </St.Image>
  );
};

export default LoginScreen;
