import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from 'native-base';
// import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {BaseScreen, Header} from 'src/components';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

import * as St from './styles';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.RECIPE>;

const RecipeScreen = ({navigation, route}: Props) => {
  // const {t} = useTranslation();
  const theme = useTheme();
  const {title} = route.params;

  return (
    <BaseScreen
      id={route.name}
      noPadding
      header={{
        type: Header.TYPE.ACTION,
        title,
        onBackPress: () => navigation.pop(),
        actionButton: {
          icon: 'share-variant-outline',
          onPress: () => console.log('Compartilhar'),
        },
      }}>
      <St.Image
        alt={`Foto prato ${title}`}
        theme={theme}
        source={{uri: 'https://wallpaperaccess.com/full/317501.jpg'}}
      />
    </BaseScreen>
  );
};

export default RecipeScreen;
