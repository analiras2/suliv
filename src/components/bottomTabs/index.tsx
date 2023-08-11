/* eslint-disable react/no-unstable-nested-components */
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {StackNames} from 'src/navigation/stacks';
import {FavoritesScreen, HomeScreen, ProfileScreen} from 'src/screens';

import React from 'react';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
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
          title: t('home'),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={StackNames.FAVORITES}
        component={FavoritesScreen}
        options={{
          headerShown: false,
          title: t('favorites.title'),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="heart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={StackNames.PROFILE}
        component={ProfileScreen}
        options={{
          headerShown: false,
          title: t('profile.title'),
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
