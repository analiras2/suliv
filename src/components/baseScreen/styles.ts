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

export const Body = styled.View`
  padding: 20px;
`;
