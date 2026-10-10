import { View } from 'react-native';
import type { Flag } from '@/lib/catalog';
import { t } from '@/i18n';
import { radii } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { T } from './T';

interface Props {
  flag: Flag;
  /** White pill for use on a course accent. */
  onAccent?: boolean;
}

/** "Mis à jour" is filled, "Nouveau" is outlined. */
export function Badge({ flag, onAccent }: Props) {
  const theme = useTheme();
  const filled = flag === 'updated';
  const background = onAccent ? '#FFFFFF' : filled ? theme.ink : 'transparent';
  const color = onAccent ? '#11151C' : filled ? theme.onInk : theme.ink;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: background,
        borderColor: onAccent ? '#FFFFFF' : theme.ink,
        borderWidth: 1.5,
        borderRadius: radii.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}>
      <T variant="caption" color={color} style={{ fontFamily: 'SchibstedGrotesk_700Bold', fontSize: 11.5, lineHeight: 15 }}>
        {t.badges[flag]}
      </T>
    </View>
  );
}
