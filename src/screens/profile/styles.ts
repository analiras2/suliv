import {Image as NBImage} from 'native-base';
import styled from 'styled-components/native';

export const Image = styled(NBImage).attrs(({theme}) => ({
  height: '60px',
  width: '100px',
  marginY: theme.space[2],
}))`
  align-self: center;
`;
