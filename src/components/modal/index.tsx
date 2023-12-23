import {Button, useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {Modal as RNModal, View} from 'react-native';

import React from 'react';

import * as St from './styles';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<Props> = ({visible, onClose, children, onSubmit}) => {
  const {t} = useTranslation();
  const theme = useTheme();

  return (
    <RNModal visible={visible} transparent={true} animationType="slide">
      <St.Container>
        <St.Content theme={theme}>
          <St.Close onPress={onClose} name="close" color={theme.colors.black} />
          <View>{children}</View>
          <Button onPress={() => onSubmit()}>{t('rating.send')}</Button>
        </St.Content>
      </St.Container>
    </RNModal>
  );
};

export default Modal;
