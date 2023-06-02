import 'utils/i18n/index';
import React from 'react';
import {NativeBaseProvider} from 'native-base';
import theme from 'assets/theme';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Stacks, {StackNames} from 'navigation/stacks';
import {RootStackParamList} from 'types/navigation';

export default function App() {
  const RootStack = createNativeStackNavigator<RootStackParamList>();

  return (
    <NavigationContainer>
      <NativeBaseProvider theme={theme}>
        <RootStack.Navigator initialRouteName={StackNames.HOME}>
          {Stacks().map(stack => (
            <RootStack.Screen
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
