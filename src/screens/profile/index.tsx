import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Divider, Image, theme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {View} from 'react-native';
import {RootStackParamList} from 'src/@types/navigation';
import {SimpleItemList} from 'src/components';
import BaseScreen from 'src/components/baseScreen';
import {StackNames} from 'src/navigation/stacks';

import React from 'react';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.PROFILE
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const ProfileScreen = ({navigation}: Props) => {
  const {t} = useTranslation();

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
    <BaseScreen>
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
      <View style={{flex: 1}} />
      <Button
        onPress={() => navigation.navigate(StackNames.FAVORITES)}
        variant="link"
        size="sm"
        pl={1}
        justifyContent="flex-start">
        {t('profile.logout')}
      </Button>
      <Image
        source={require('../../assets/icons/logo.png')}
        height="60px"
        width="100px"
        alt="Logotipo Suliv"
        resizeMode="contain"
        marginY={theme.space[2]}
        style={{alignSelf: 'center'}}
      />
    </BaseScreen>
  );
};

export default ProfileScreen;
