import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { Button, Screen } from '@/components/ui';
import { AVAILABILITY_HREF } from '@/features/availability/AvailabilityExplorerScreen';
import { openWebsitePath } from '@/services/website/openWebsite';
import { colors, spacing, typography } from '@/theme';

export default function CustomerHomeScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title="Customer" subtitle="Phase 1 hybrid" />
      <View style={styles.body}>
        <Text style={styles.heading}>Customer experience</Text>
        <Text style={styles.copy}>
          Preview public professional availability in-app. Sign-in, booking, and
          payment stay on the YuktiOne website for this phase.
        </Text>
        <InfoBanner
          tone="info"
          title="Native booking APIs not available"
          message="No fake authentication or payments. Website browser is used for secure sessions."
        />
      </View>
      <View style={styles.actions}>
        <Button
          title="Open Home UI preview"
          onPress={() => router.push('/(tabs)/home')}
        />
        <Button
          title="Preview availability"
          variant="secondary"
          onPress={() => router.push(AVAILABILITY_HREF)}
        />
        <Button
          title="Customer login (website)"
          variant="ghost"
          onPress={() => {
            void openWebsitePath('customerLogin');
          }}
        />
        <Button
          title="Register (website)"
          variant="ghost"
          onPress={() => {
            void openWebsitePath('customerRegister');
          }}
        />
        <Button
          title="Back to welcome"
          variant="ghost"
          onPress={() => router.replace('/welcome')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  body: {
    gap: spacing.md,
    flex: 1,
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
  },
  copy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
});
