import {View} from 'react-native';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

export const OptionsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  padding: ${INNER_PADDING};
`;

export const Option = styled(View)`
  flex-direction: row;
  align-items: center;
`;
