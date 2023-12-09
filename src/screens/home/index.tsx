import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  BaseScreen,
  Header,
  ISectionList,
  RecipeCard,
  SectionList,
  Typography,
} from 'src/components';
import {IRecipe} from 'src/entities';
import {RECIPE_MOCK} from 'src/mocks';
import {StackRoutes} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.HOME>;

const HomeScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();

  const section: ISectionList<IRecipe>[] = [
    {title: t('home.popular'), data: RECIPE_MOCK},
    {title: 'Receitas', data: RECIPE_MOCK},
  ];

  return (
    <BaseScreen
      id={route.name}
      header={{
        type: Header.TYPE.LOGO,
        onSearchPress: () => console.log('Pesquisar'),
      }}
      hideScroll>
      <SectionList
        sections={section}
        renderHeader={({title}) => {
          return (
            <Typography mb={2} type={Typography.TYPE.TITLE}>
              {title}
            </Typography>
          );
        }}
        renderItem={({item}) => (
          <RecipeCard
            recipe={item}
            onPress={() => navigation.navigate(StackRoutes.RECIPE, item)}
          />
        )}
      />
    </BaseScreen>
  );
};

export default HomeScreen;
