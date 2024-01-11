import {Text, useTheme} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import React from 'react';

import Typography from '../../typography';
import * as St from './styles';

export interface IItemListProps {
  title: string;
  onPress: () => void;
  selectedItem?: string;
}

const ItemList = ({title, onPress, selectedItem}: IItemListProps) => {
  const theme = useTheme();
  const color = theme.colors.primary[400];

  return (
    <St.Container theme={theme} onPress={onPress} activeOpacity={0.5}>
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
