import {CustomThemeType} from 'src/@types/theme';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

export const Container = styled.SafeAreaView<Props>`
  flex: 1;
  background-color: ${({theme}) => theme.colors.secondary[100]};
`;

export const Body = styled.View`
  padding: 20px;
`;
