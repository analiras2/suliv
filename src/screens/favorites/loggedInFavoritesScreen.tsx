import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {FlatList} from 'react-native';
import {BaseScreen, Header, RecipeCard} from 'src/components';
import {RECIPE_MOCK} from 'src/mocks';
import {StackRoutes} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.FAVORITES>;

const LoggedInFavoriteScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen
      id={route.name}
      header={{type: Header.TYPE.NAV, title: t('favorites.title')}}
      hideScroll>
      <FlatList
        data={RECIPE_MOCK}
        keyExtractor={(_, pos) => `recipe-${pos}`}
        numColumns={2}
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

export default LoggedInFavoriteScreen;
