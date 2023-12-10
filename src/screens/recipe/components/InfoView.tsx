import {useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {FavIcon, Typography} from 'src/components';
import {IRecipe} from 'src/entities';

import React from 'react';

import * as St from './styles';

type Props = {
  icon: string;
  info: string | number;
};

const Info = ({icon, info}: Props) => {
  return (
    <St.Option>
      <Icon name={icon} size={24} />
      <Typography marginLeft={1} type={Typography.TYPE.TINY}>
        {info}
      </Typography>
    </St.Option>
  );
};

const InfoView = ({recipe}: {recipe: IRecipe}) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const [isActive, setIsActive] = React.useState(false);

  const onFavPress = () => setIsActive(!isActive);

  return (
    <St.OptionsContainer theme={theme}>
      <Info icon="clock-outline" info={`${recipe.time.total} min`} />
      <Info
        icon="account-multiple-outline"
        info={t('recipe.portion', {count: recipe.yield})}
      />
      <Info icon="star-half-full" info={recipe.social.averageScore} />
      <FavIcon isActive={isActive} onPress={onFavPress} />
    </St.OptionsContainer>
  );
};

export default InfoView;
