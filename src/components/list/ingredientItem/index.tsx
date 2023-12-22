import Typography from 'src/components/typography';

import React from 'react';

import * as St from './styles';

const IngredientItem = ({item}: {item: {name: string; quantity: string}}) => {
  return (
    <St.Row>
      <Typography type={Typography.TYPE.TINY} mr={2}>
        {item.name}
      </Typography>
      <Typography type={Typography.TYPE.VERY_TINY}>{item.quantity}</Typography>
    </St.Row>
  );
};

export default IngredientItem;
