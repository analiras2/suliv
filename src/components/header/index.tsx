import {IUser} from 'src/entities';

import React from 'react';

import Typography from '../typography';
import ActionHeader, {ActionProps} from './action';
import LogoHeader from './logo';
import ProfileHeader from './profile';

enum TYPE {
  ACTION,
  LOGO,
  NAV,
  PROFILE,
}

export interface HeaderProps extends ActionProps {
  type?: TYPE;
  onSearchPress?: () => void;
  user?: IUser;
}

const Header = ({
  type,
  title,
  actionButton,
  onBackPress,
  onSearchPress,
  user,
}: HeaderProps) => {
  switch (type) {
    case TYPE.ACTION:
      return (
        <ActionHeader
          title={title}
          onBackPress={onBackPress}
          actionButton={actionButton}
        />
      );
    case TYPE.LOGO:
      return <LogoHeader onSearchPress={onSearchPress} />;
    case TYPE.NAV:
      return (
        <Typography
          mt={2}
          mb={8}
          textAlign="center"
          type={Typography.TYPE.SCREEN_TITLE}>
          {title}
        </Typography>
      );
    case TYPE.PROFILE: {
      if (!user) {
        console.error('Please pass a user');
        return null;
      }
      return <ProfileHeader user={user} />;
    }
    default:
      return null;
  }
};

Header.TYPE = TYPE;

export default Header;
