import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {
  BaseScreen,
  Header,
  ISectionList,
  SectionList,
  Typography,
} from 'src/components';
import {IIngredient} from 'src/entities';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

import InfoView from './components/InfoView';
import * as St from './styles';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.RECIPE>;

const RecipeScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();

  const section: ISectionList<IIngredient>[] = [
    {title: t('recipe.ingredients'), data: route.params.ingredients},
    {title: t('recipe.preparation'), data: route.params.ingredients},
  ];

  return (
    <BaseScreen
      id={route.name}
      noPadding
      hideScroll
      header={{
        type: Header.TYPE.ACTION,
        title: route.params.title,
        onBackPress: () => navigation.pop(),
        actionButton: {
          icon: 'share-variant-outline',
          onPress: () => console.log('Compartilhar'),
        },
      }}>
      <St.Image
        alt={`Foto prato ${route.params.title}`}
        theme={theme}
        source={{uri: 'https://wallpaperaccess.com/full/317501.jpg'}}
      />
      <InfoView recipe={route.params} />
      <St.Container>
        <SectionList
          list
          sections={section}
          renderHeader={({title}) => {
            return (
              <Typography mb={2} type={Typography.TYPE.TINY_TITLE}>
                {title}
              </Typography>
            );
          }}
          renderItem={({item}) => (
            <St.Row>
              <Typography type={Typography.TYPE.TINY} mr={2}>
                {item.name}
              </Typography>
              <Typography type={Typography.TYPE.VERY_TINY}>
                {item.quantity}
              </Typography>
            </St.Row>
          )}
        />
      </St.Container>
    </BaseScreen>
  );
};

export default RecipeScreen;
