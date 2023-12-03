import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {
  BaseScreen,
  ISectionList,
  RecipeCard,
  SectionList,
  Typography,
} from 'src/components';
import {IRecipe} from 'src/entities';
import {RECIPE_MOCK} from 'src/mocks';
import {StackNames} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackNames.HOME>;

const HomeScreen = ({route}: Props) => {
  const {t} = useTranslation();

  const section: ISectionList<IRecipe>[] = [
    {title: t('home.popular'), data: RECIPE_MOCK},
    {title: 'Receitas', data: RECIPE_MOCK},
  ];

  return (
    <BaseScreen id={route.name} header={{showLogo: true}} hideScroll>
      <SectionList
        sections={section}
        renderHeader={({title}) => {
          return (
            <Typography mb={5} type={Typography.TYPE.TITLE}>
              {title}
            </Typography>
          );
        }}
        renderItem={({item}) => (
          <RecipeCard recipe={item} onPress={() => console.log('Aqui click')} />
        )}
      />
    </BaseScreen>
  );
};

export default HomeScreen;
