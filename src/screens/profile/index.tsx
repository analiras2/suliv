import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Text} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {StackNames} from 'src/navigation/stacks';

import React from 'react';

import BaseScreen from '../baseScreen';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.PROFILE
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProfileScreen = ({navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen>
      <Text mb={5}>{t('profile.title')}</Text>
    </BaseScreen>
  );
};

export default ProfileScreen;
