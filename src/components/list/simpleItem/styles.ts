import {CustomThemeType} from 'src/@types/theme';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

export const Container = styled.TouchableOpacity<Props>`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-vertical: ${({theme}) => theme.space['1']};
`;
