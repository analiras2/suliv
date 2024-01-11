import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, Divider, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {BaseScreen, FlexView, Header, SimpleItemList} from 'src/components';
import {useAppState} from 'src/hooks/AppContext';
import {USER_MOCK} from 'src/mocks';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

import * as St from './styles';
import {menu} from './utils';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.PROFILE>;

const ProfileScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {language, setLanguage} = useAppState();

  return (
    <BaseScreen
      id={route.name}
      header={{type: Header.TYPE.PROFILE, user: USER_MOCK}}>
      <>
        {menu(t, language, setLanguage).map((options, index) => (
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
        onPress={() => navigation.navigate(StackRoutes.FAVORITES)}
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
