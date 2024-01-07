import Typography from 'src/components/typography';
import {IIngredient} from 'src/entities';

import React from 'react';

import * as St from './styles';

const IngredientItem = ({item}: {item: IIngredient}) => {
  return (
    <St.Row>
      <Typography type={Typography.TYPE.TINY} mr={2}>
        {item.title}
      </Typography>
      <Typography type={Typography.TYPE.VERY_TINY}>{item.quantity}</Typography>
    </St.Row>
  );
};

export default IngredientItem;
