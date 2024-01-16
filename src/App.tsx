import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import theme from 'assets/theme';
import {NativeBaseProvider} from 'native-base';
import Stacks, {StackRoutes} from 'navigation/stacks';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'types/navigation';
import 'utils/i18n/index';

import React from 'react';

import {AppProvider} from './hooks/AppContext';

export default function App() {
  const {i18n} = useTranslation();
  const RootStack = createNativeStackNavigator<RootStackParamList>();

  return (
    <AppProvider i18n={i18n}>
      <NavigationContainer>
        <NativeBaseProvider theme={theme}>
          <RootStack.Navigator initialRouteName={StackRoutes.LOGIN}>
            {Stacks().map(stack => (
              <RootStack.Screen
                key={stack.name}
                name={stack.name}
                component={stack.component}
                options={stack.options || {}}
              />
            ))}
          </RootStack.Navigator>
        </NativeBaseProvider>
      </NavigationContainer>
    </AppProvider>
  );
}
