import { View } from 'react-native';
import { TOUCH, radii } from '@/theme/tokens';
import { T } from './T';
import { Tap } from './Tap';

interface Props<V extends string> {
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  colors: { track: string; thumb: string; text: string; activeText: string };
}

export function Segmented<V extends string>({ options, value, onChange, colors }: Props<V>) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: radii.tile, padding: 3 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Tap
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: TOUCH - 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.tile - 3,
              backgroundColor: active ? colors.thumb : 'transparent',
            }}>
            <T variant="bodyStrong" color={active ? colors.activeText : colors.text}>
              {option.label}
            </T>
          </Tap>
        );
      })}
    </View>
  );
}
