import { Stack } from 'expo-router';

import { SetupFormProvider } from '@/features/professional/setup/SetupFormContext';
import { colors } from '@/theme';

export default function ProfessionalLayout() {
  return (
    <SetupFormProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.canvas },
          animation: 'slide_from_right',
        }}
      />
    </SetupFormProvider>
  );
}
