import {Box, useTheme} from 'native-base';

import React from 'react';

import Typography from '../typography';
import * as St from './styles';

export type HeaderProps = {
  showLogo?: boolean;
  title?: string;
  onBackPress?: () => void;
  onSearchPress?: () => void;
};

const Header = ({showLogo, title, onBackPress, onSearchPress}: HeaderProps) => {
  const theme = useTheme();

  return showLogo ? (
    <St.Container testID="Analira" theme={theme}>
      <St.Image
        source={require('../../assets/icons/logo.png')}
        alt="Logotipo Suliv"
        resizeMode="contain"
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
        {title && (
          <Typography type={Typography.TYPE.SCREEN_TITLE}>{title}</Typography>
        )}
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
