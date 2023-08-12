import {extendTheme} from 'native-base';

const theme = extendTheme({
  colors: {
    primary: {
      50: '#EDEFEC',
      100: '#B7C1B5',
      200: '#A6B2A2',
      300: '#82937D',
      400: '#5F7559',
      500: '#495B45',
      600: '#3F4E3B',
      700: '#344131',
      800: '#2A3427',
      900: '#1F271D',
    },
    secondary: {
      50: '#fefdfa',
      100: '#FFF9EF',
      200: '#fdf7ec',
      300: '#fcf5e7',
      400: '#FCF3E3',
      500: '#d2cabd',
      600: '#a8a297',
      700: '#7e7971',
      800: '#54514b',
      900: '#2a2825',
    },
  },
  fontConfig: {
    NunitoSans: {
      100: {
        normal: 'NunitoSans-Regular',
        italic: 'NunitoSans-Italic',
      },
      200: {
        normal: 'NunitoSans-Regular',
        italic: 'NunitoSans-Italic',
      },
      300: {
        normal: 'NunitoSans-Regular',
        italic: 'NunitoSans-Italic',
      },
      400: {
        normal: 'NunitoSans-Regular',
        italic: 'NunitoSans-Italic',
      },
      500: {
        normal: 'NunitoSans-SemiBold',
        italic: 'NunitoSans-BoldItalic',
      },
      600: {
        normal: 'NunitoSans-Bold',
        italic: 'NunitoSans-BoldItalic',
      },
    },
  },

  // Make sure values below matches any of the keys in `fontConfig`
  fonts: {
    heading: 'NunitoSans',
    body: 'NunitoSans',
    mono: 'NunitoSans',
  },
  components: {
    Text: {
      baseStyle: {
        fontSize: 16,
      },
    },
    Button: {
      sizes: {
        lg: {
          _text: {
            fontSize: '20px',
          },
        },
        md: {
          _text: {
            fontSize: '18px',
          },
        },
        sm: {
          _text: {
            fontSize: '16px',
          },
        },
      },
    },
  },
});

export default theme;
