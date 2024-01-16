import {IInputProps, Input} from 'native-base';

import React from 'react';

const TextInput = (props: IInputProps) => {
  return (
    <Input
      borderRadius="8"
      py="4"
      px="4"
      bgColor="white"
      fontSize="14"
      {...props}
    />
  );
};

export default TextInput;
