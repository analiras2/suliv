import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CustomThemeType} from 'src/@types/theme';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

export const Container = styled(View)`
  flex: 1;
  padding: ${INNER_PADDING};
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
`;

export const Content = styled(View)<Props>`
  width: 100%;
  background-color: ${({theme}) => theme.colors.secondary[100]};
  border-radius: 10px;
  padding: ${INNER_PADDING};
  justify-content: center;
  align-self: center;
`;

export const Close = styled(Icon).attrs(({onPress, size = 24}) => ({
  onPress,
  size,
}))`
  align-self: flex-end;
  margin-bottom: 20px;
`;
