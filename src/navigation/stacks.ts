import {useTranslation} from 'react-i18next';
import FavoritesScreen from 'src/screens/favorites';
import HomeScreen from 'src/screens/home';

export enum StackNames {
  HOME = 'home',
  FAVORITES = 'favorites',
}

const Stacks = () => {
  const {t} = useTranslation();

  return [
    {name: StackNames.HOME, component: HomeScreen},
    {
      name: StackNames.FAVORITES,
      component: FavoritesScreen,
      options: {title: t('favorites.title')},
    },
  ];
};

export default Stacks;
