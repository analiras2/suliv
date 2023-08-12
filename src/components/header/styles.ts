import {Box} from 'native-base';
import {CustomThemeType} from 'src/@types/theme';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

export const LogoContainer = styled(Box)<Props>`
  background-color: ${({theme}: Props) => theme.colors.secondary[400]};
`;

export const ContainerTitle = styled(Box)<Props>`
  flex: 2;
  align-items: center;
  background-color: ${({theme}: Props) => theme.colors.secondary[400]};
`;

export const ContainerLeft = styled(Box)<Props>`
  flex: 1;
  justify-content: flex-start;
  background-color: ${({theme}: Props) => theme.colors.secondary[400]};
`;

export const ContainerRight = styled(Box)<Props>`
  flex: 1;
  justify-content: flex-end;
  background-color: ${({theme}: Props) => theme.colors.secondary[400]};
`;

export const Space = styled.View`
  flex: 1;
`;
