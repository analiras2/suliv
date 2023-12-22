import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CustomThemeType} from 'src/@types/theme';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

const commonStyles = (theme: CustomThemeType) => `
  border-radius: 8px;
  padding: 10px;
  justify-content: center;
  align-items: center;
  elevation: 4;
  shadow-color: ${theme.colors.black};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
`;

export const TouchableContainer = styled.TouchableOpacity.attrs(() => ({
  activeOpacity: 0.8,
}))<Props>`
  background-color: ${({theme}) => theme.colors.white};
  ${({theme}) => commonStyles(theme)};
`;

export const Container = styled(View)<Props>`
  background-color: ${({theme}) => theme.colors.white};
  ${({theme}) => commonStyles(theme)};
`;

export const StarButton = styled(Icon).attrs(({onPress, size = 24}) => ({
  onPress,
  size,
}))`
  margin-horizontal: 10px;
`;
