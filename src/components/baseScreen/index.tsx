import {useTheme} from 'native-base';
import {Header, HeaderProps} from 'src/components';

import React from 'react';

import {FlexView} from '../shared';
import * as St from './styles';

type BaseScreenProps = {
  hideHeader?: boolean;
  header?: HeaderProps;
  children: JSX.Element | JSX.Element[];
};

const BaseScreen = ({hideHeader, header, children}: BaseScreenProps) => {
  const theme = useTheme();

  return (
    <FlexView>
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
        <St.ScrollView>
          <St.Body>{children}</St.Body>
        </St.ScrollView>
      </St.Container>
    </FlexView>
  );
};

export default BaseScreen;
