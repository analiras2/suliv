import {NavigationBar} from 'src/components';
import {RecipeScreen} from 'src/screens';

export enum StackRoutes {
  BOTTOM_TABS = 'bottomTabs',
  HOME = 'home',
  FAVORITES = 'favorites',
  PROFILE = 'profile',
  RECIPE = 'recipe',
}

const Stacks = () => [
  {
    name: StackRoutes.BOTTOM_TABS,
    component: NavigationBar,
    options: {headerShown: false},
  },
  {
    name: StackRoutes.RECIPE,
    component: RecipeScreen,
    options: {headerShown: false},
  },
];

export default Stacks;
