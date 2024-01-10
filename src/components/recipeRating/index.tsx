import {Box, useTheme} from 'native-base';
import {StyleProp, ViewStyle} from 'react-native/types';

import React, {useEffect, useState} from 'react';

import Typography from '../typography';
import * as St from './styles';

interface Props {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  getRatting?: (rate: number) => void;
}

const RecipeRating = ({onPress, style, getRatting}: Props) => {
  const theme = useTheme();
  const starsArray = Array.from({length: 5}, (_, index) => index + 1);

  const [rating, setRating] = useState(onPress ? 0 : 1);

  useEffect(() => {
    if (getRatting) {
      getRatting(rating);
    }
  }, [rating, getRatting]);

  const renderContent = () => (
    <>
      <Typography type={Typography.TYPE.TINY}>Avalie esta receita</Typography>
      <Box flexDirection="row">
        {starsArray.map(index => (
          <St.StarButton
            key={index}
            disabled={!!onPress}
            onPress={() => {
              if (!onPress) setRating(index);
            }}
            name={index <= rating ? 'star' : 'star-outline'}
            color={
              index <= rating ? theme.colors.yellow[500] : theme.colors.black
            }
          />
        ))}
      </Box>
    </>
  );

  return onPress ? (
    <St.PressableContainer theme={theme} onPress={onPress} style={style}>
      {renderContent()}
    </St.PressableContainer>
  ) : (
    <St.Container theme={theme} style={style}>
      {renderContent()}
    </St.Container>
  );
};

export default RecipeRating;
