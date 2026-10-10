import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/store/toast';
import { radii } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { T } from './T';

const VISIBLE_MS = 3200;

/** Floating pill for sync results and errors. Mounted once in the root layout. */
export function Toast() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { message, key, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, key, hide]);

  if (!message) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 10, left: 20, right: 20, alignItems: 'center' }}>
      <View
        accessibilityLiveRegion="polite"
        style={{
          backgroundColor: theme.ink,
          borderRadius: radii.pill,
          paddingHorizontal: 18,
          paddingVertical: 11,
          maxWidth: 420,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}>
        <T variant="bodyStrong" color={theme.onInk} style={{ textAlign: 'center' }}>
          {message}
        </T>
      </View>
    </View>
  );
}
