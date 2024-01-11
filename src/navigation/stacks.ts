import {NavigationBar} from 'src/components';
import {MyRecipesScreen, RecipeScreen} from 'src/screens';

export enum StackRoutes {
  BOTTOM_TABS = 'bottomTabs',
  HOME = 'home',
  FAVORITES = 'favorites',
  PROFILE = 'profile',
  RECIPE = 'recipe',
  MY_RECIPES = 'myRecipes',
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
  {
    name: StackRoutes.MY_RECIPES,
    component: MyRecipesScreen,
    options: {headerShown: false},
  },
];

export default Stacks;
