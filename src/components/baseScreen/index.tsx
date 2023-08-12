import {useTheme} from 'native-base';
import {Header} from 'src/components';

import React from 'react';

import * as St from './styles';

type BaseScreenProps = {
  children: JSX.Element | JSX.Element[];
};

const BaseScreen = ({children}: BaseScreenProps) => {
  const theme = useTheme();

  return (
    <>
      <St.StatusBar theme={theme} />
      <St.Container theme={theme}>
        <Header
          // showLogo
          onSearchPress={() => {
            // TODO
          }}
          onBackPress={() => {
            // TODO
          }}
          title="Search"
        />
        <St.Body>{children}</St.Body>
      </St.Container>
    </>
  );
};

export default BaseScreen;
