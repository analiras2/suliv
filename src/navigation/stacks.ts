// import {useTranslation} from 'react-i18next';
import {NavigationBar} from 'src/components';

export enum StackNames {
  BOTTOM_TABS = 'bottomTabs',
  HOME = 'home',
  FAVORITES = 'favorites',
  PROFILE = 'profile',
}

const Stacks = () => {
  // const {t} = useTranslation();

  return [
    {
      name: StackNames.BOTTOM_TABS,
      component: NavigationBar,
      options: {headerShown: false},
    },
  ];
};

export default Stacks;
