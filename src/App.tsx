import 'utils/i18n/index';
import React from 'react';
import {NativeBaseProvider} from 'native-base';
import HomeScreen from 'screens/home';
import theme from 'assets/theme';

export default function App() {
  return (
    <NativeBaseProvider theme={theme}>
      <HomeScreen />
    </NativeBaseProvider>
  );
}
