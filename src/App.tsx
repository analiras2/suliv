import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import theme from 'assets/theme';
import {NativeBaseProvider} from 'native-base';
import Stacks, {StackNames} from 'navigation/stacks';
import {RootStackParamList} from 'types/navigation';
import 'utils/i18n/index';

import React from 'react';

export default function App() {
  const RootStack = createNativeStackNavigator<RootStackParamList>();

  return (
    <NavigationContainer>
      <NativeBaseProvider theme={theme}>
        <RootStack.Navigator initialRouteName={StackNames.BOTTOM_TABS}>
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
  );
}
