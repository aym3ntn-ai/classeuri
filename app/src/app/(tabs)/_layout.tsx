import Tabs from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="(courses)" />
      <Tabs.Screen name="downloads" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
