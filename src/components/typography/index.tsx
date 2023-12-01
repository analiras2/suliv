import {ITextProps, Text} from 'native-base';

import React from 'react';

enum TYPE {
  SCREEN_TITLE,
  TITLE,
  DEFAULT,
  TINY,
  VERY_TINY,
}

type Props = ITextProps & {
  type?: TYPE;
  children?: string | number;
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
        <Text fontSize="22px" fontFamily="body" fontWeight={600} {...props}>
          {children}
        </Text>
      );
    case TYPE.TINY:
      return (
        <Text fontSize="14px" fontFamily="body" fontWeight={500} {...props}>
          {children}
        </Text>
      );
    case TYPE.VERY_TINY:
      return (
        <Text fontSize="10px" fontFamily="body" fontWeight={500} {...props}>
          {children}
        </Text>
      );

    default:
      return (
        <Text fontFamily="body" {...props}>
          {children}
        </Text>
      );
  }
};

Typography.TYPE = TYPE;

export default Typography;
