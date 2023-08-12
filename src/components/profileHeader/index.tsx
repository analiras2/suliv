import {Avatar, useTheme} from 'native-base';
import {getInitials} from 'src/utils';

import React from 'react';

import Typography, {TYPE} from '../typography';
import * as St from './styles';

type Props = {
  user: {name: string; email: string; nickname: string};
};

const ProfileHeader = ({user}: Props) => {
  const theme = useTheme();

  return (
    <St.Container theme={theme}>
      <Avatar size={71} bg={theme.colors.primary[100]}>
        <Typography type={TYPE.TITLE}>{getInitials(user.name)}</Typography>
      </Avatar>
      <St.Info theme={theme}>
        <Typography fontSize="lg" fontWeight={500}>
          {user.nickname}
        </Typography>
        <Typography fontSize="sm">{user.email}</Typography>
      </St.Info>
    </St.Container>
  );
};

export default ProfileHeader;
