import React from 'react';
import {Text} from 'native-base';
import {useTranslation} from 'react-i18next';
import {StackNames} from 'src/navigation/stacks';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from 'src/@types/navigation';
import BaseScreen from '../baseScreen';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.PROFILE
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const ProfileScreen = ({navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen>
      <Text mb={5}>{t('profile.title')}</Text>
    </BaseScreen>
  );
};

export default ProfileScreen;
