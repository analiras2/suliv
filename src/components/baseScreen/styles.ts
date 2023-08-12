import {CustomThemeType} from 'src/@types/theme';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

export const StatusBar = styled.SafeAreaView<Props>`
  padding: -20px;
  background-color: ${({theme}) => theme.colors.secondary[400]};
`;

export const Container = styled.SafeAreaView<Props>`
  height: 100%;
  width: 100%;
  background-color: ${({theme}) => theme.colors.secondary[100]};
`;

export const ScrollView = styled.ScrollView.attrs(() => ({
  contentContainerStyle: {
    flexGrow: 1,
  },
}))``;

export const Body = styled.View`
  flex: 1;
  padding-horizontal: 20px;
  margin-bottom: 44px;
`;
