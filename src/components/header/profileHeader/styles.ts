import {Box} from 'native-base';
import styled from 'styled-components/native';

export const Container = styled(Box).attrs(({theme}) => ({
  paddingY: theme.space[1],
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
