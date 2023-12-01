import {Box, useTheme} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FavIcon from 'src/components/favIcon';
import {IRecipe} from 'src/entities';

import React, {useEffect, useRef, useState} from 'react';

import Typography from '../../typography';
import * as St from './styles';

export interface IRecipeCardProps {
  recipe: IRecipe;
  onPress: () => void;
}

const RecipeCard = ({recipe, onPress}: IRecipeCardProps) => {
  const theme = useTheme();
  const [lastPress, setLastPress] = useState<number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    const now = Date.now();
    const doublePressDelay = 400;

    if (lastPress && now - lastPress < doublePressDelay) {
      onFavPress();

      setLastPress(null);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    } else {
      setLastPress(now);
      timeoutIdRef.current = setTimeout(() => {
        onPress();
        timeoutIdRef.current = null;
      }, doublePressDelay);
    }
  };

  const onFavPress = () => console.log('Favoritou');

  return (
    <St.Container theme={theme} onPress={handlePress}>
      <Box>
        <St.Image
          source={{uri: 'https://wallpaperaccess.com/full/317501.jpg'}}
        />
        <St.TopIcons>
          <FavIcon onPress={onFavPress} />
        </St.TopIcons>
        <St.BottomIcons>
          <St.IconBg>
            <Icon name="leaf" size={16} color={theme.colors.primary[400]} />
          </St.IconBg>
          <St.RateContainer mt={1}>
            <Icon name="star" size={14} />
            <Typography type={Typography.TYPE.VERY_TINY}>
              {recipe.social.averageScore}
            </Typography>
          </St.RateContainer>
        </St.BottomIcons>
      </Box>
      <Typography
        type={Typography.TYPE.TINY}
        textAlign="center"
        numberOfLines={2}
        padding={1}>
        {recipe.title}
      </Typography>
    </St.Container>
  );
};

export default RecipeCard;
