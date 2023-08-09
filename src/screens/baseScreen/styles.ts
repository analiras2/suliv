import {StyleSheet} from 'react-native';
import {CustomThemeType} from 'src/@types/theme';

export default (theme: CustomThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary[50],
    },
  });
