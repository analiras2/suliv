import {Text, useTheme} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import React from 'react';

import Typography from '../../typography';
import * as St from './styles';

type ItemListProps = {
  title: string;
  onPress: () => void;
  selectedItem?: string | null;
};

const ItemList = ({title, onPress, selectedItem}: ItemListProps) => {
  const theme = useTheme();
  const color = theme.colors.primary[400];

  return (
    <St.Container theme={theme} onPress={onPress}>
      <Text>{title}</Text>
      {selectedItem ? (
        <Typography color={color} fontWeight={500}>
          {selectedItem}
        </Typography>
      ) : (
        <Icon name="chevron-right" size={24} color={color} />
      )}
    </St.Container>
  );
};

export default ItemList;
