/* eslint-disable react/no-unstable-nested-components */
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {StackNames} from 'src/navigation/stacks';
import {FavoritesScreen, HomeScreen, ProfileScreen} from 'src/screens';

import React from 'react';

const Tab = createBottomTabNavigator();

const NavigationBar = () => {
  const {t} = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={() => ({
        tabBarStyle: {
          height: 86,
          paddingTop: theme.space[2],
          backgroundColor: theme.colors.secondary[400],
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSizes.xs,
        },
        tabBarInactiveTintColor: theme.colors.primary[200],
        tabBarActiveTintColor: theme.colors.primary[400],
      })}>
      <Tab.Screen
        name={StackNames.HOME}
        component={HomeScreen}
        options={{
          headerShown: false,
          title: t('home.title'),
          tabBarIcon: ({focused, color, size}) => (
            <Icon
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name={StackNames.FAVORITES}
        component={FavoritesScreen}
        options={{
          headerShown: false,
          title: t('favorites.title'),
          tabBarIcon: ({focused, color, size}) => (
            <Icon
              name={focused ? 'heart' : 'heart-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name={StackNames.PROFILE}
        component={ProfileScreen}
        options={{
          headerShown: false,
          title: t('profile.title'),
          tabBarIcon: ({focused, color, size}) => (
            <Icon
              name={focused ? 'account' : 'account-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default NavigationBar;
