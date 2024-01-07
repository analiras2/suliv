import {View} from 'react-native';
import Typography from 'src/components/typography';
import {IPreparation} from 'src/entities/recipe/preparation';

import React from 'react';

const PreparationItem = ({item}: {item: IPreparation}) => {
  return (
    <View>
      <Typography type={Typography.TYPE.TINY_BOLD} mr={2}>
        {item.title}
      </Typography>
      <Typography type={Typography.TYPE.VERY_TINY}>{item.content}</Typography>
    </View>
  );
};

export default PreparationItem;
