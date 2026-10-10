import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';
import { dark, light, type Palette } from './tokens';

export function useIsDark(): boolean {
  const system = useColorScheme();
  const choice = useSettings((s) => s.theme);
  return choice === 'system' ? system === 'dark' : choice === 'dark';
}

export function useTheme(): Palette {
  return useIsDark() ? dark : light;
}
