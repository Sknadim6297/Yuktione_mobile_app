import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Previous customer UI surfaces kept reachable after the 24-screen redesign.
 * Primary product routes still use the new reference screens.
 */
export default function ClassicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.canvas },
      }}
    />
  );
}
