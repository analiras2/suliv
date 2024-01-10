import {Box, Image as NBImage} from 'native-base';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

export const LogoContainer = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
  paddingX: theme.space[0.5],
  height: theme.space[5],
}))`
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  padding: ${INNER_PADDING};
`;

export const Container = styled(View)`
  flex-direction: row;
  align-items: center;
  height: 54px;
`;

export const IconButton = styled(Icon).attrs(({onPress, size = 24}) => ({
  onPress,
  size,
}))`
  margin-horizontal: 10px;
`;

export const Image = styled(NBImage).attrs(() => ({
  height: '50px',
  width: '90px',
  ml: -2,
}))`
  align-self: flex-start;
`;

export const ProfileContainer = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
  paddingX: theme.space[1],
}))`
  flex-direction: row;
  align-items: center;
`;

export const Info = styled(Box).attrs(({theme}) => ({
  flex: 1,
  ml: theme.space[1],
}))`
  justify-content: center;
`;
