import {Image as NBImage} from 'native-base';
import {View} from 'react-native';
import {RecipeRating} from 'src/components';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

export const Image = styled(NBImage).attrs(() => ({
  height: '180px',
  width: '100%',
}))``;

export const Container = styled(View)`
  padding-horizontal: ${INNER_PADDING};
`;

export const Row = styled(View)`
  flex-direction: row;
  align-items: center;
`;

export const Rating = styled(RecipeRating)`
  margin-bottom: ${INNER_PADDING};
`;
