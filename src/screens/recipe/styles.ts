import {Image as NBImage} from 'native-base';
import {TextInput, View} from 'react-native';
import {CustomThemeType} from 'src/@types/theme';
import {RecipeRating} from 'src/components';
import {INNER_PADDING} from 'src/utils';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

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

export const CommentInput = styled(TextInput).attrs(({theme}) => ({
  placeholderTextColor: theme.colors.black,
  multiline: true,
}))<Props>`
  height: 280px;
  background-color: ${({theme}) => theme.colors.gray[200]};
  margin-bottom: 20px;
  border-radius: 4px;
  padding: 10px;
`;
