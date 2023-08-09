import {useTranslation} from 'react-i18next';
import {BottomTabs} from 'src/components';

export enum StackNames {
  BOTTOM_TABS = 'bottomTabs',
  HOME = 'home',
  FAVORITES = 'favorites',
  PROFILE = 'profile',
}

const Stacks = () => {
  const {t} = useTranslation();

  return [
    {
      name: StackNames.BOTTOM_TABS,
      component: BottomTabs,
      options: {headerShown: false},
    },
  ];
};

export default Stacks;
