import {Image as NBImage} from 'native-base';
import {View} from 'react-native';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

export const Image = styled(NBImage).attrs(() => ({
  height: '180px',
  width: '100%',
}))``;

export const Container = styled(View)`
  padding: ${INNER_PADDING};
`;

export const Row = styled(View)`
  flex-direction: row;
  align-items: center;
`;
