import {useTheme} from 'native-base';
import {Animated, Easing} from 'react-native';

import React, {useState} from 'react';

import SearchBar from '../searchBar';
import * as St from './styles';

const LogoHeader = ({onSearchPress}: {onSearchPress?: () => void}) => {
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const theme = useTheme();

  const toggleSearchBar = () => {
    setSearchBarVisible(!searchBarVisible);
    Animated.timing(animation, {
      toValue: searchBarVisible ? 0 : 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  return (
    <St.LogoContainer theme={theme}>
      {!searchBarVisible && (
        <St.Image
          source={require('../../assets/icons/logo.png')}
          alt="Logotipo Suliv"
          resizeMode="contain"
        />
      )}

      {onSearchPress && !searchBarVisible && (
        <St.IconButton name="magnify" onPress={toggleSearchBar} size={30} />
      )}
      {searchBarVisible && (
        <SearchBar onSearch={console.log} onClose={toggleSearchBar} />
      )}
    </St.LogoContainer>
  );
};

export default LogoHeader;
