import Svg, { Path } from 'react-native-svg';

import { colors } from '@/design-system/tokens';

export type BranchDoodleProps = {
  size?: number;
  color?: string;
};

export function BranchDoodle({ size = 64, color = colors.olive500 }: BranchDoodleProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M4 40C16 36 22 26 22 14M22 14C22 20 27 22 32 20M22 14C18 12 17 7 19 3M32 20C36 22 42 20 46 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
