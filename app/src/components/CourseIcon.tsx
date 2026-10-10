import type { CourseIcon as IconName } from '@classeuri/shared';
import { Activity, Atom, BookOpen, Code, Cog, Cpu, FlaskConical, Globe, Sigma, Zap, type LucideIcon } from 'lucide-react-native';

const ICONS: Record<IconName, LucideIcon> = {
  book: BookOpen,
  bolt: Zap,
  chip: Cpu,
  wave: Activity,
  atom: Atom,
  function: Sigma,
  code: Code,
  flask: FlaskConical,
  globe: Globe,
  gear: Cog,
};

export const ICON_STROKE = 1.8;

export function CourseIcon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon color={color} size={size} strokeWidth={ICON_STROKE} />;
}
