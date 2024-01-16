import {NavigationBar} from 'src/components';
import {
  LoginEmailScreen,
  MyRecipesScreen,
  RecipeScreen,
  SingUpScreen,
} from 'src/screens';
import LoginScreen from 'src/screens/auth';

export enum StackRoutes {
  LOGIN = 'login',
  EMAIL = 'login-email',
  SING_UP = 'sing-up',
  BOTTOM_TABS = 'bottomTabs',
  HOME = 'home',
  FAVORITES = 'favorites',
  PROFILE = 'profile',
  RECIPE = 'recipe',
  MY_RECIPES = 'myRecipes',
}

const Stacks = () => [
  {
    name: StackRoutes.LOGIN,
    component: LoginScreen,
    options: {headerShown: false},
  },
  {
    name: StackRoutes.EMAIL,
    component: LoginEmailScreen,
    options: {headerShown: false},
  },
  {
    name: StackRoutes.SING_UP,
    component: SingUpScreen,
    options: {headerShown: false},
  },
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
