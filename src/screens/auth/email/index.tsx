import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from 'native-base';
import {useTranslation} from 'react-i18next';
import {BaseScreen, Header, TextInput} from 'src/components';
import {StackRoutes} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.EMAIL>;

const LoginEmailScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen
      id={route.name}
      withBgImg
      header={{
        type: Header.TYPE.ACTION,
        onBackPress: () => navigation.pop(),
      }}>
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
    </BaseScreen>
  );
};

export default LoginEmailScreen;
