import {useTheme} from 'native-base';

import React from 'react';

import FlexView from '../flexView';
import Header, {HeaderProps} from '../header';
import * as St from './styles';

interface Props {
  id: string;
  hideHeader?: boolean;
  header?: HeaderProps;
  children?: React.ReactNode | React.ReactNode[];
  hideScroll?: boolean;
}

const BaseScreen = ({
  id,
  hideHeader,
  header,
  children,
  hideScroll = false,
}: Props) => {
  const theme = useTheme();

  return (
    <FlexView testID={id}>
      <St.StatusBar theme={theme} />
      <St.Container theme={theme}>
        {!hideHeader && (
          <Header
            showLogo={header?.showLogo}
            onSearchPress={header?.onSearchPress}
            onBackPress={header?.onBackPress}
            title={header?.title}
          />
        )}
        {hideScroll ? (
          <St.Body>{children}</St.Body>
        ) : (
          <St.ScrollView>
            <St.Body>{children}</St.Body>
          </St.ScrollView>
        )}
      </St.Container>
    </FlexView>
  );
};

export default BaseScreen;
