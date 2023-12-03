import {NavigationBar} from 'src/components';

export enum StackNames {
  BOTTOM_TABS = 'bottomTabs',
  HOME = 'home',
  FAVORITES = 'favorites',
  PROFILE = 'profile',
}

const Stacks = () => [
  {
    name: StackNames.BOTTOM_TABS,
    component: NavigationBar,
    options: {headerShown: false},
  },
];

export default Stacks;
