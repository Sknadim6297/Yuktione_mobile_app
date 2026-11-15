import { Tabs } from 'expo-router';

import { customer } from '@/theme';

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: customer.canvas },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="tools" options={{ title: 'Tools' }} />
      <Tabs.Screen name="experts" options={{ title: 'Experts' }} />
      <Tabs.Screen name="my-space" options={{ title: 'My Space' }} />
      {/* Still routable from menu/notifications; not shown in bottom nav */}
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', href: null }} />
    </Tabs>
  );
}
