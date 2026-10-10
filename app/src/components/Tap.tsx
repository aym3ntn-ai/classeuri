import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  label?: string;
  /** Set to false when a disabled control should keep its normal look. */
  dimWhenDisabled?: boolean;
}

/** Pressable with the shared pressed feedback and an accessibility label. */
export function Tap({ style, label, disabled, dimWhenDisabled = true, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [style, { opacity: disabled ? (dimWhenDisabled ? 0.45 : 1) : pressed ? 0.7 : 1 }]}
    />
  );
}
