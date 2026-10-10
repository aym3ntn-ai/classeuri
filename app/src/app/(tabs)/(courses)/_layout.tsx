import { Stack } from 'expo-router/stack';
import { useTheme } from '@/theme/useTheme';

export default function CoursesLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />;
}
