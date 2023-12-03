import {Box, useTheme} from 'native-base';

import React from 'react';

import Typography from '../typography';
import * as St from './styles';

export type HeaderProps = {
  showLogo?: boolean;
  title?: string;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  actionButton?: {icon: string; onPress?: () => void; size?: number};
};

const Header = ({
  showLogo,
  title,
  onBackPress,
  onSearchPress,
  actionButton,
}: HeaderProps) => {
  const theme = useTheme();

  return showLogo ? (
    <St.LogoContainer testID="Analira" theme={theme}>
      <St.Image
        source={require('../../assets/icons/logo.png')}
        alt="Logotipo Suliv"
        resizeMode="contain"
      />

      {onSearchPress && (
        <St.IconButton
          name="magnify"
          theme={theme}
          onPress={onSearchPress}
          size={30}
        />
      )}
    </St.LogoContainer>
  ) : (
    <St.Container flexDirection="row" theme={theme}>
      <Box width={9}>
        {onBackPress && (
          <St.IconButton
            name="chevron-left"
            theme={theme}
            onPress={onBackPress}
            size={32}
          />
        )}
      </Box>

      <Box flex={2} alignItems="center">
        {title && (
          <Typography numberOfLines={1} type={Typography.TYPE.SCREEN_TITLE}>
            {title}
          </Typography>
        )}
      </Box>
      <Box width={9} ml={2}>
        {actionButton && (
          <St.IconButton
            name={actionButton.icon}
            theme={theme}
            onPress={actionButton.onPress}
            size={actionButton.size}
          />
        )}
      </Box>
    </St.Container>
  );
};

export default Header;
