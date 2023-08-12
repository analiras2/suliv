import {Box} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styled from 'styled-components/native';

export const Container = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
  paddingX: theme.space[0.5],
  bg: theme.colors.secondary[400],
}))`
  background-color: ${({theme}) => theme.colors.secondary[400]};
`;

export const IconButton = styled(Icon).attrs(({theme, onPress}) => ({
  onPress,
  color: theme.colors.black,
  size: 32,
}))`
  padding: 0;
  align-items: center;
`;
