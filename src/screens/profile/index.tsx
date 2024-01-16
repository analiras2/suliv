import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, Divider, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {BaseScreen, FlexView, Header, SimpleItemList} from 'src/components';
import {LANGUAGES, useAppState} from 'src/hooks/AppContext';
import {USER_MOCK} from 'src/mocks';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

import * as St from './styles';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.PROFILE>;

const ProfileScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {language, setLanguage} = useAppState();

  const menu = [
    [
      {
        title: t('profile.myRecipes'),
        onPress: () => navigation.navigate(StackRoutes.MY_RECIPES),
      },
      {
        title: t('profile.language'),
        onPress: () =>
          setLanguage(
            language === 'pt'
              ? LANGUAGES.EN
              : language === 'en'
              ? LANGUAGES.ES
              : LANGUAGES.PT,
          ),
        selectedItem: t('language'),
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
    <BaseScreen
      id={route.name}
      withBgImg
      header={{type: Header.TYPE.PROFILE, user: USER_MOCK}}>
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
        onPress={() => navigation.navigate(StackRoutes.HOME)}
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
