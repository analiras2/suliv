import {HStack} from 'native-base';
import {CustomThemeType} from 'src/@types/theme';
import styled from 'styled-components/native';

type Props = {
  theme: CustomThemeType;
};

export const Container = styled.TouchableOpacity<Props>`
  border-radius: 8px;
  background-color: ${({theme}) => theme.colors.white};
  flex: 1;
  margin: 8px;
  elevation: 4;
  shadow-color: ${({theme}) => theme.colors.black};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
`;

export const Image = styled.Image`
  height: 150px;
  width: 100%;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

export const RateContainer = styled(HStack)`
  padding: 2px 4px;
  background-color: rgba(212, 212, 212, 0.6);
  border-radius: 30px;
`;

export const TopIcons = styled.View`
  position: absolute;
  flex-direction: row;
  top: 8px;
  right: 8px;
`;

export const BottomIcons = styled.View`
  position: absolute;
  bottom: 8px;
  left: 8px;
`;

export const IconBg = styled.View`
  width: 24px;
  height: 24px;
  background-color: rgba(212, 212, 212, 0.6);
  border-radius: 50px;
  align-items: center;
  justify-content: center;
`;
