import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Divider, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {SimpleItemList} from 'src/components';
import BaseScreen from 'src/components/baseScreen';
import ProfileHeader from 'src/components/profileHeader';
import {FlexView} from 'src/components/shared';
import {USER_MOCK} from 'src/mocks';
import {StackNames} from 'src/navigation/stacks';

import React from 'react';

import * as St from './styles';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.PROFILE
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const ProfileScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();

  const menu = [
    [
      {title: t('profile.myRecipes'), onPress: () => {}},
      {
        title: t('profile.language'),
        onPress: () => {},
        selectedItem: 'Português',
      },
    ],
    [
      {title: t('profile.rateApp'), onPress: () => {}},
      {title: t('profile.shareApp'), onPress: () => {}},
      {title: t('profile.reportProblem'), onPress: () => {}},
    ],
    [
      {title: t('profile.privacyPolicy'), onPress: () => {}},
      {title: t('profile.termsOfUse'), onPress: () => {}},
    ],
  ];

  return (
    <BaseScreen hideHeader>
      <ProfileHeader user={USER_MOCK} />
      <>
        {menu.map((options, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Divider marginY={theme.space[1]} color={theme.colors.red[500]} />
            )}
            {options.map((item, itemIndex) => (
              <SimpleItemList key={itemIndex} {...item} />
            ))}
          </React.Fragment>
        ))}
      </>
      <FlexView />
      <Button
        onPress={() => navigation.navigate(StackNames.FAVORITES)}
        variant="link"
        size="sm"
        pl={1}
        justifyContent="flex-start">
        {t('profile.logout')}
      </Button>
      <St.Image
        theme={theme}
        source={require('../../assets/icons/logo.png')}
        alt="Logotipo Suliv"
        resizeMode="contain"
      />
    </BaseScreen>
  );
};

export default ProfileScreen;
