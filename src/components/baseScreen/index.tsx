import {useTheme} from 'native-base';

import React from 'react';

import FlexView from '../flexView';
import Header, {HeaderProps} from '../header';
import * as St from './styles';

interface ComponentProps {
  header?: HeaderProps;
  children?: React.ReactNode | React.ReactNode[];
  hideScroll?: boolean;
  noPadding?: boolean;
}

interface Props extends ComponentProps {
  id: string;
  withBgImg?: boolean;
}

const Component = ({
  header,
  children,
  hideScroll = false,
  noPadding = false,
}: ComponentProps) => (
  <>
    <Header {...header} />
    {hideScroll ? (
      <St.Body noPadding={noPadding}>{children}</St.Body>
    ) : (
      <St.ScrollView>
        <St.Body noPadding={noPadding}>{children}</St.Body>
      </St.ScrollView>
    )}
  </>
);

const BaseScreen = ({id, withBgImg = false, ...props}: Props) => {
  const theme = useTheme();

  return (
    <FlexView testID={id}>
      <St.StatusBar theme={theme} />
      <St.Container theme={theme}>
        {withBgImg ? (
          <St.Image
            source={require('src/assets/imgs/bbg.png')}
            resizeMode="cover">
            <Component {...props} />
          </St.Image>
        ) : (
          <Component {...props} />
        )}
      </St.Container>
    </FlexView>
  );
};

export default BaseScreen;
