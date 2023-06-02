import React from 'react';
import {Box, Button, Text} from 'native-base';
import {useTranslation} from 'react-i18next';
import {StackNames} from 'src/navigation/stacks';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from 'src/@types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  StackNames.HOME
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen = ({navigation}: Props) => {
  const {t} = useTranslation();

  return (
    <Box p={5}>
      <Text mb={5}>{t('appName')}</Text>
      <Button onPress={() => navigation.navigate(StackNames.FAVORITES)}>
        {t('favorites.title')}
      </Button>
    </Box>
  );
};

export default HomeScreen;
