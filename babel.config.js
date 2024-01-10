module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          src: './src',
          types: './src/@types',
          assets: './src/assets',
          components: './src/components',
          entities: './src/entities',
          navigation: './src/navigation',
          screens: './src/screens',
          utils: './src/utils',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
