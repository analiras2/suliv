import {useTheme} from 'native-base';

import React from 'react';

import * as St from './styles';

const LogoHeader = ({onSearchPress}: {onSearchPress?: () => void}) => {
  const theme = useTheme();

  return (
    <St.LogoContainer theme={theme}>
      <St.Image
        source={require('../../assets/icons/logo.png')}
        alt="Logotipo Suliv"
        resizeMode="contain"
      />

      {onSearchPress && (
        <St.IconButton name="magnify" onPress={onSearchPress} size={30} />
      )}
    </St.LogoContainer>
  );
};

export default LogoHeader;
