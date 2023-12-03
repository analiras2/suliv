import {NativeStackScreenProps} from '@react-navigation/native-stack';
// import {useTheme} from 'native-base';
// import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {BaseScreen, Typography} from 'src/components';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.RECIPE>;

const RecipeScreen = ({navigation, route}: Props) => {
  // const {t} = useTranslation();
  // const theme = useTheme();
  const {title} = route.params;

  return (
    <BaseScreen
      id={route.name}
      header={{
        title,
        onBackPress: () => navigation.pop(),
        actionButton: {
          icon: 'share-variant-outline',
          onPress: () => console.log('Compartilhar'),
        },
      }}>
      <Typography>Receita aqui</Typography>
    </BaseScreen>
  );
};

export default RecipeScreen;
