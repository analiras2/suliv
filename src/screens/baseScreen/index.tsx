import {Box, useTheme} from 'native-base';
import {SafeAreaView} from 'react-native';

import React, {ReactNode} from 'react';

import styles from './styles';

type BaseScreenProps = {
  children: ReactNode;
};

const BaseScreen: React.FC<BaseScreenProps> = ({children}) => {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles(theme).container}>
      <Box p={5}>{children}</Box>
    </SafeAreaView>
  );
};

export default BaseScreen;
