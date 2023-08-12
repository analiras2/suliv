import {Box, Image, Text, useTheme} from 'native-base';
import {GestureResponderEvent} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import React from 'react';

type Props = {
  showLogo?: boolean;
  title?: string;
  onBackPress?: (event: GestureResponderEvent) => void;
  onSearchPress?: (event: GestureResponderEvent) => void;
};

const Header = ({showLogo, title, onBackPress, onSearchPress}: Props) => {
  const theme = useTheme();

  return showLogo ? (
    <Box
      paddingY={theme.space[1]}
      paddingX={theme.space[0.5]}
      bg={theme.colors.secondary[400]}>
      <Image
        source={require('../../assets/icons/logo.png')}
        height="40px"
        alt="Logotipo Suliv"
        resizeMode="contain"
      />
    </Box>
  ) : (
    <Box
      flexDirection="row"
      paddingY={theme.space[1]}
      paddingX={theme.space[0.5]}
      bg={theme.colors.secondary[400]}>
      <Box width={9}>
        {onBackPress && (
          <Icon
            name="chevron-left"
            onPress={onBackPress}
            color={theme.colors.black}
            size={32}
            style={{
              padding: 0,
              alignItems: 'center',
              backgroundColor: 'yellow',
            }}
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
          <Icon
            name="chevron-right"
            onPress={onSearchPress}
            color={theme.colors.black}
            size={32}
            style={{
              padding: 0,
              alignItems: 'center',
              backgroundColor: 'yellow',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default Header;
