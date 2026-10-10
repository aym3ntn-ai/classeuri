import { Text, type TextProps } from 'react-native';
import { type TypeVariant, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props extends TextProps {
  variant?: TypeVariant;
  color?: string;
}

/** Text in one of the design's type styles; ink by default. */
export function T({ variant = 'body', color, style, ...rest }: Props) {
  const theme = useTheme();
  return <Text {...rest} style={[type[variant], { color: color ?? theme.ink }, style]} />;
}
