import {useTheme} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styled from 'styled-components/native';

import React from 'react';

interface FavIconProps {
  onPress: () => void;
  isActive?: boolean;
}

const FavIcon = ({isActive, onPress}: FavIconProps) => {
  const theme = useTheme();

  return (
    <Container onPress={onPress}>
      <Icon
        name="heart"
        size={16}
        color={isActive ? theme.colors.red[600] : theme.colors.white}
      />
    </Container>
  );
};

export const Container = styled.TouchableOpacity.attrs({
  activeOpacity: 0.5,
})`
  padding: 4px;
  background-color: rgba(212, 212, 212, 0.6);
  border-radius: 32px;
`;

export default FavIcon;
