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
      {/* Routable from My Space, menu and notifications. The visible five-tab bar is CustomerPage's own nav, so it never lists Bookings. */}
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
    </Tabs>
  );
}
