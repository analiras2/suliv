import {StackNames} from 'src/navigation/stacks';

type RootStackParamList = {
  [StackNames.BOTTOM_TABS]: FunctionComponent<{}>;
  [StackNames.HOME]: FunctionComponent<{}>;
  [StackNames.FAVORITES]: FunctionComponent<{}>;
  [StackNames.PROFILE]: FunctionComponent<{}>;
};
