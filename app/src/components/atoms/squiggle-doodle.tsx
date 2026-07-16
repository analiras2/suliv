import Svg, { Path } from 'react-native-svg';

import { colors } from '@/design-system/tokens';

export type SquiggleDoodleProps = {
  size?: number;
  color?: string;
};

export function SquiggleDoodle({ size = 64, color = colors.clay500 }: SquiggleDoodleProps) {
  return (
    <Svg width={size} height={size * 0.375} viewBox="0 0 64 24" fill="none">
      <Path
        d="M2 18C8 6 14 6 20 18C26 6 32 6 38 18C44 6 50 6 56 18C58 20 60 20 62 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
