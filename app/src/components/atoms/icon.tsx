import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bean,
  Bell,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  CircleMinus,
  Clock,
  Egg,
  Filter,
  Heart,
  Home,
  Leaf,
  LogOut,
  Milk,
  Minus,
  Nut,
  Plus,
  Salad,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sprout,
  Star,
  Sun,
  User,
  Utensils,
  Vegan,
  Wheat,
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
  vegan: Vegan,
  vegetarian: Salad,
  flexitarian: Utensils,
  milk: Milk,
  eggs: Egg,
  wheat: Wheat,
  peanut: Bean,
  nuts: Nut,
  soy: Sprout,
  sesame: CircleMinus,
  plus: Plus,
  minus: Minus,
  warning: AlertTriangle,
  star: Star,
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
