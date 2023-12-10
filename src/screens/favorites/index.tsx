import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from 'src/@types/navigation';
import {StackRoutes} from 'src/navigation/stacks';

import React from 'react';

import LoggedInFavoriteScreen from './loggedInFavoritesScreen';
import LoginFavoritesScreen from './loginFavoritesScreen';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.FAVORITES>;

const FavoritesScreen = (props: Props) => {
  const USER_IS_LOGGED_IN_MOCK = true;

  return USER_IS_LOGGED_IN_MOCK ? (
    <LoggedInFavoriteScreen {...props} />
  ) : (
    <LoginFavoritesScreen {...props} />
  );
};

export default FavoritesScreen;
