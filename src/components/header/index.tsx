import {Box, Image, useTheme} from 'native-base';
import {GestureResponderEvent} from 'react-native';

import React from 'react';

import Typography, {TYPE} from '../typography';
import * as St from './styles';

export type HeaderProps = {
  showLogo?: boolean;
  title?: string;
  onBackPress?: (event: GestureResponderEvent) => void;
  onSearchPress?: (event: GestureResponderEvent) => void;
};

const Header = ({showLogo, title, onBackPress, onSearchPress}: HeaderProps) => {
  const theme = useTheme();

  return showLogo ? (
    <St.Container theme={theme}>
      <Image
        source={require('../../assets/icons/logo.png')}
        height="50px"
        width="90px"
        alt="Logotipo Suliv"
        resizeMode="contain"
        mt={2}
        style={{alignSelf: 'flex-start'}}
      />
    </St.Container>
  ) : (
    <St.Container flexDirection="row" theme={theme}>
      <Box width={9}>
        {onBackPress && (
          <St.IconButton
            name="chevron-left"
            theme={theme}
            onPress={onBackPress}
          />
        )}
      </Box>

      <Box flex={2} alignItems="center">
        {title && <Typography type={TYPE.SCREEN_TITLE}>{title}</Typography>}
      </Box>
      <Box width={9}>
        {onSearchPress && (
          <St.IconButton
            name="chevron-right"
            theme={theme}
            onPress={onSearchPress}
          />
        )}
      </Box>
    </St.Container>
  );
};

export default Header;
