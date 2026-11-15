import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Button, Screen } from '@/components/ui';
import { toolById } from '@/features/customer/content';
import { ToolRunnerScreen } from '@/features/customer/DiscoverScreens';
import { toolHref } from '@/features/customer/liveCatalog';
import { ToolDetailScreen } from '@/features/tools/ToolDetailScreen';
import { getPreviewTool } from '@/features/tools/toolCatalog';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { fetchTool } from '@/services/api/catalog';
import { colors, fontFamilies, spacing } from '@/theme';
import { customer } from '@/theme/customer';

/** Tool runner. Prefers website registry slugs; keeps local runners where mapped. */
export default function ToolDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();

  const liveTool = useQuery({
    queryKey: ['v1', 'tools', id],
    queryFn: async () => {
      const result = await fetchTool(id);
      if (!result.ok) throw new Error(result.message);
      return result.tool;
    },
    enabled: liveEnabled && Boolean(id) && !toolById(id),
  });

  if (toolById(id)) {
    return <ToolRunnerScreen id={id} />;
  }

  if (liveEnabled && liveTool.isLoading) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader title="Tool" onBack={() => router.back()} />
        <ActivityIndicator color={customer.teal} />
      </Screen>
    );
  }

  if (liveTool.data) {
    const href = toolHref(liveTool.data);
    if (href && typeof href === 'string' && href !== `/tools/${id}`) {
      router.replace(href);
      return null;
    }
    if (!liveTool.data.mobile_ready) {
      return (
        <Screen scroll contentStyle={styles.content}>
          <AppHeader title={liveTool.data.name} onBack={() => router.back()} />
          <Text style={styles.subtitle}>
            {liveTool.data.mobile_message ??
              'This tool is available on the YuktiOne website. A dedicated mobile experience is not ready yet.'}
          </Text>
          <Button title="Back to Tools" onPress={() => router.replace('/(tabs)/tools')} />
        </Screen>
      );
    }
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader title={liveTool.data.name} onBack={() => router.back()} />
        <Text style={styles.subtitle}>{liveTool.data.description}</Text>
        <Text style={styles.subtitle}>
          Category: {liveTool.data.category?.name ?? 'Uncategorised'} ·{' '}
          {liveTool.data.access_type === 'free' ? 'Free' : 'Paid'}
        </Text>
        <Button
          title="Open on website later"
          onPress={() =>
            Alert.alert(
              liveTool.data.name,
              'Full interactive runners for this registry tool will use the website module path in a later phase.',
            )
          }
        />
      </Screen>
    );
  }

  const tool = getPreviewTool(id);

  if (!tool) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader title="Tool" onBack={() => router.back()} />
        <Text style={styles.subtitle}>
          {liveTool.error?.message ?? 'Unknown tool.'}
        </Text>
        <Button title="Back to Tools" onPress={() => router.replace('/(tabs)/tools')} />
      </Screen>
    );
  }

  return <ToolDetailScreen tool={tool} />;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  subtitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
