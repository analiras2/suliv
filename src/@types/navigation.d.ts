import {IRecipe} from 'src/entities';
import {StackRoutes} from 'src/navigation/stacks';

type RootStackParamList = {
  [StackRoutes.BOTTOM_TABS]: FunctionComponent<{}>;
  [StackRoutes.HOME]: FunctionComponent<{}>;
  [StackRoutes.FAVORITES]: FunctionComponent<{}>;
  [StackRoutes.PROFILE]: FunctionComponent<{}>;
  [StackRoutes.RECIPE]: IRecipe;
};
