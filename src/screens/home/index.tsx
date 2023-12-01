import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {FlatList} from 'react-native';
import {BaseScreen, RecipeCard, Typography} from 'src/components';
import {RECIPE_MOCK} from 'src/mocks';
import {StackNames} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackNames.HOME>;

const HomeScreen = ({route}: Props) => {
  const {t} = useTranslation();

  return (
    <BaseScreen id={route.name} header={{showLogo: true}} hideScroll>
      <Typography mb={5} type={Typography.TYPE.TITLE}>
        {t('home.popular')}
      </Typography>
      <FlatList
        data={RECIPE_MOCK}
        renderItem={({item}) => (
          <RecipeCard recipe={item} onPress={() => console.log('Aqui click')} />
        )}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
      />
    </BaseScreen>
  );
};

export default HomeScreen;
