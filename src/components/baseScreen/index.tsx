import {useTheme} from 'native-base';

import React from 'react';

import FlexView from '../flexView';
import Header, {HeaderProps} from '../header';
import * as St from './styles';

interface Props {
  id: string;
  header?: HeaderProps;
  children?: React.ReactNode | React.ReactNode[];
  hideScroll?: boolean;
  noPadding?: boolean;
}

const BaseScreen = ({
  id,
  header,
  children,
  hideScroll = false,
  noPadding = false,
}: Props) => {
  const theme = useTheme();

  return (
    <FlexView testID={id}>
      <St.StatusBar theme={theme} />
      <St.Container theme={theme}>
        <Header {...header} />
        {hideScroll ? (
          <St.Body noPadding={noPadding}>{children}</St.Body>
        ) : (
          <St.ScrollView>
            <St.Body noPadding={noPadding}>{children}</St.Body>
          </St.ScrollView>
        )}
      </St.Container>
    </FlexView>
  );
};

export default BaseScreen;
