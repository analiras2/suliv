import {useTheme} from 'native-base';

import React from 'react';

import Typography from '../typography';
import * as St from './styles';

export type ActionProps = {
  title?: string;
  onBackPress?: () => void;
  actionButton?: {icon: string; onPress?: () => void; size?: number};
};

const ActionHeader = ({title, onBackPress, actionButton}: ActionProps) => {
  const theme = useTheme();

  return (
    <St.Container theme={theme}>
      {onBackPress && (
        <St.IconButton name="chevron-left" onPress={onBackPress} size={32} />
      )}
      <Typography
        flex={2}
        type={Typography.TYPE.TITLE}
        numberOfLines={1}
        textAlign="center">
        {title}
      </Typography>

      {actionButton ? (
        <St.IconButton
          name={actionButton.icon}
          onPress={actionButton.onPress}
          size={actionButton.size}
        />
      ) : (
        <St.IconButton
          disabled
          name="chevron-left"
          size={32}
          style={{opacity: 0}}
        />
      )}
    </St.Container>
  );
};

export default ActionHeader;
