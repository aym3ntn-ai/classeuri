import type { ReactElement, ReactNode } from 'react';
import { ScrollView, type RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props {
  children: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
}

/** Scrolling page with the standard padding, below the system status bar. */
export function Screen({ children, refreshControl }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      refreshControl={refreshControl}
      contentContainerStyle={{
        paddingTop: insets.top + 18,
        paddingHorizontal: space.screen,
        paddingBottom: 32,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
      }}>
      {children}
    </ScrollView>
  );
}
