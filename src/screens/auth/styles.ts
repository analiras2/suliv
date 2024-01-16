import {Image, ImageBackground} from 'react-native';
import styled from 'styled-components/native';

export const Background = styled(ImageBackground)`
  flex: 1;
  align-items: center;
  padding-top: 100px;
`;

export const Logo = styled(Image)`
  width: 380px;
  height: 380px;
  margin-left: -32px;
`;
