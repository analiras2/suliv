import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button, VStack, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {BaseScreen, Header, RecipeCard, Typography} from 'src/components';
import {RECIPE_MOCK} from 'src/mocks';
import {StackRoutes} from 'src/navigation/stacks';
import {RootStackParamList} from 'types/navigation';

import React from 'react';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.PROFILE>;

const MyRecipesScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();

  const HAS_RECIPE_MOCK = false;

  return (
    <BaseScreen
      id={route.name}
      hideScroll
      header={{
        type: Header.TYPE.ACTION,
        title: t('profile.myRecipes'),
        onBackPress: () => navigation.pop(),
      }}>
      {HAS_RECIPE_MOCK ? (
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
      ) : (
        <VStack pb={70} flex={1} alignItems="center" justifyContent="center">
          <Icon
            name="food-variant-off"
            size={80}
            color={theme.colors.primary[400]}
          />
          <Typography
            my={8}
            type={Typography.TYPE.SCREEN_TITLE}
            textAlign="center">
            Você ainda não enviou suas receitas!
          </Typography>
          <Typography mb={8}>Gostaria de enviar uma receita agora?</Typography>
          <Button>Enviar receita</Button>
        </VStack>
      )}
    </BaseScreen>
  );
};

export default MyRecipesScreen;
