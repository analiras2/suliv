import {ImageBackground} from 'react-native';
import {CustomThemeType} from 'src/@types/theme';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
  noPadding?: boolean;
  withBgImg?: boolean;
};

export const Image = styled(ImageBackground)`
  flex: 1;
  justify-content: center;
`;

export const StatusBar = styled.SafeAreaView<Props>`
  padding: -20px;
  background-color: ${({theme}) => theme.colors.secondary[400]};
`;

export const Container = styled.SafeAreaView<Props>`
  height: 100%;
  width: 100%;
  background-color: ${({theme, withBgImg}) =>
    withBgImg ? 'transparent' : theme.colors.secondary[100]};
`;

export const ScrollView = styled.ScrollView.attrs(() => ({
  contentContainerStyle: {
    flexGrow: 1,
  },
}))``;

export const Body = styled.View<Props>`
  flex: 1;
  padding-horizontal: ${({noPadding}) => (noPadding ? 0 : INNER_PADDING)};
  margin-bottom: 44px;
`;
