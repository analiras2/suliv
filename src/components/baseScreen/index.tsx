import {ScrollView, useTheme} from 'native-base';
import {View} from 'react-native';
import {Header, HeaderProps} from 'src/components';

import React from 'react';

import * as St from './styles';

type BaseScreenProps = {
  header?: HeaderProps;
  children: JSX.Element | JSX.Element[];
};

const BaseScreen = ({header, children}: BaseScreenProps) => {
  const theme = useTheme();

  return (
    <View style={{flex: 1}}>
      <St.StatusBar theme={theme} />
      <St.Container theme={theme}>
        <Header
          showLogo={header?.showLogo}
          onSearchPress={header?.onSearchPress}
          onBackPress={header?.onBackPress}
          title={header?.title}
        />
        <ScrollView contentContainerStyle={{flexGrow: 1}}>
          <St.Body>{children}</St.Body>
        </ScrollView>
      </St.Container>
    </View>
  );
};

export default BaseScreen;
