import {Box, Image, Text, useTheme} from 'native-base';
import {GestureResponderEvent} from 'react-native';

import React from 'react';

import * as St from './styles';

type Props = {
  showLogo?: boolean;
  title?: string;
  onBackPress?: (event: GestureResponderEvent) => void;
  onSearchPress?: (event: GestureResponderEvent) => void;
};

const Header = ({showLogo, title, onBackPress, onSearchPress}: Props) => {
  const theme = useTheme();

  return showLogo ? (
    <St.Container theme={theme}>
      <Image
        source={require('../../assets/icons/logo.png')}
        height="40px"
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
          <Text fontSize="24px" fontFamily="body" fontWeight={500}>
            {title}
          </Text>
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
