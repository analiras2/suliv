import {ITextProps, Text} from 'native-base';

import React from 'react';

export enum TYPE {
  SCREEN_TITLE,
  TITLE,
  DEFAULT,
}

type Props = ITextProps & {
  type?: TYPE;
  children: string;
};

const Typography = ({type = TYPE.DEFAULT, children, ...props}: Props) => {
  switch (type) {
    case TYPE.SCREEN_TITLE:
      return (
        <Text
          mb={5}
          fontSize="24px"
          fontFamily="body"
          fontWeight={500}
          {...props}>
          {children}
        </Text>
      );

    case TYPE.TITLE:
      return (
        <Text
          mb={5}
          fontSize="22px"
          fontFamily="body"
          fontWeight={600}
          {...props}>
          {children}
        </Text>
      );

    default:
      return <Text {...props}>{children}</Text>;
  }
};

export default Typography;
