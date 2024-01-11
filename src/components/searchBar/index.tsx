import {Button, Input, Icon as NBIcon, Row, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import React, {useEffect, useState} from 'react';

const SearchBar = ({
  onSearch,
  onClose,
}: {
  onSearch: (text: string) => void;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const {t} = useTranslation();

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchText);
    }, 2000);
    return () => clearTimeout(timer);
  }, [searchText, onSearch]);

  const handleInputChange = (text: string) => {
    setSearchText(text);
  };

  return (
    <Row>
      <Input
        placeholder={t('home.searchFor')}
        width="75%"
        borderRadius="4"
        py="3"
        px="1"
        bgColor="white"
        fontSize="14"
        value={searchText}
        onChangeText={handleInputChange}
        InputLeftElement={
          <NBIcon
            m="2"
            ml="3"
            size="6"
            color={theme.colors.primary[400]}
            as={<Icon name="magnify" size={30} />}
          />
        }
        InputRightElement={
          searchText ? (
            <NBIcon
              m="2"
              mr="3"
              size="5"
              color={theme.colors.primary[400]}
              as={
                <Icon
                  name="close-circle"
                  onPress={() => setSearchText('')}
                  size={30}
                />
              }
            />
          ) : (
            <></>
          )
        }
      />
      <Button
        onPress={onClose}
        variant="link"
        textDecoration={false}
        size="sm"
        justifyContent="flex-start">
        {t('home.cancel')}
      </Button>
    </Row>
  );
};

export default SearchBar;
