import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from 'native-base';
import {useTranslation} from 'react-i18next';
import {BaseScreen, Header, TextInput} from 'src/components';
import {StackRoutes} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.PROFILE>;

const SingUpScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen
      id={route.name}
      withBgImg
      header={{
        type: Header.TYPE.ACTION,
        title: t('singUp.title'),
        onBackPress: () => navigation.pop(),
      }}>
      <TextInput mt={8} mb={4} placeholder={t('singUp.fullName')} />
      <TextInput mb={4} placeholder={t('singUp.email')} />
      <TextInput mb={4} placeholder={t('singUp.password')} />
      <TextInput mb={8} placeholder={t('singUp.passwordConfirmation')} />
      <Button>{t('singUp.register')}</Button>
    </BaseScreen>
  );
};

export default SingUpScreen;
