import {Box, Image as NBImage} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styled from 'styled-components/native';

export const LogoContainer = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
  paddingX: theme.space[0.5],
  height: theme.space[5],
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
}))``;

export const Container = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
  paddingX: theme.space[0.5],
  height: theme.space[5],
}))``;

export const IconButton = styled(Icon).attrs(({theme, onPress, size = 24}) => ({
  onPress,
  color: theme.colors.black,
  size,
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
