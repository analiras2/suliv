import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Home,
  Leaf,
  LogOut,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sun,
  User,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '@/design-system/tokens';

const ICONS = {
  home: Home,
  search: Search,
  heart: Heart,
  bookmark: Bookmark,
  calendar: Calendar,
  user: User,
  clock: Clock,
  arrowRight: ArrowRight,
  back: ArrowLeft,
  filter: Filter,
  leaf: Leaf,
  share: Share2,
  check: Check,
  close: X,
  sparkle: Sparkles,
  chevron: ChevronRight,
  sun: Sun,
  bell: Bell,
  logOut: LogOut,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

const DEFAULT_STROKE_WIDTH = 1.75;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
};

export function Icon({
  name,
  size = 22,
  color = colors.ink900,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  filled = false,
}: IconProps) {
  const LucideComponent = ICONS[name];
  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : 'none'}
    />
  );
}
