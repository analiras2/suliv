import {Box, Image as NBImage} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styled from 'styled-components/native';

export const Container = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
  paddingX: theme.space[0.5],
  height: theme.space[5],
  alignItems: 'center',
}))``;

export const IconButton = styled(Icon).attrs(({theme, onPress}) => ({
  onPress,
  color: theme.colors.black,
  size: 32,
}))`
  padding: 0;
  align-items: center;
`;

export const Image = styled(NBImage).attrs(() => ({
  height: '50px',
  width: '90px',
  mt: 2,
}))`
  align-self: flex-start;
`;
