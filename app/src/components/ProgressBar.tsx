import { View } from 'react-native';

interface Props {
  /** 0–1 */
  value: number;
  color: string;
  track: string;
  height?: number;
}

export function ProgressBar({ value, color, track, height = 4 }: Props) {
  const percent = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${percent}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}
