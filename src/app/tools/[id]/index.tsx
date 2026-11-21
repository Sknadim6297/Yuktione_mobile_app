import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Button, Screen } from '@/components/ui';
import { toolById } from '@/features/customer/content';
import { ToolRunnerScreen } from '@/features/customer/DiscoverScreens';
import { toolHref } from '@/features/customer/liveCatalog';
import { BmiBmrScreen } from '@/features/tools/BmiBmrScreen';
import {
  ToolErrorScreen,
  ToolLoadingScreen,
  WebsiteToolScreen,
} from '@/features/tools/ToolDetailParts';
import { ToolDetailScreen } from '@/features/tools/ToolDetailScreen';
import { GratitudeScreen } from '@/features/tools/gratitude/GratitudeScreen';
import { JournalScreen } from '@/features/tools/journal/JournalScreen';
import { MoodCheckinScreen } from '@/features/tools/mood/MoodCheckinScreen';
import { WaterIntakeScreen } from '@/features/tools/water/WaterIntakeScreen';
import { CareerInterestScreen } from '@/features/tools/career/CareerInterestScreen';
import { NutritionScreen } from '@/features/tools/nutrition/NutritionScreen';
import { SkillsStrengthsScreen } from '@/features/tools/skills/SkillsStrengthsScreen';
import { TarotReflectionScreen } from '@/features/tools/tarot/TarotReflectionScreen';
import { WeightJourneyScreen } from '@/features/tools/weight/WeightJourneyScreen';
import { getPreviewTool } from '@/features/tools/toolCatalog';
import { TOOLS_LIVE, useToolDetail } from '@/features/tools/toolsCatalogue';
import { colors, fontFamilies, spacing } from '@/theme';

const NATIVE_SCREENS = new Set(['bmi-bmr-calculator']);

/** Tool route: account runners by local id, website registry tools by slug. */
export default function ToolDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const local = toolById(id);
  const liveTool = useToolDetail(local || !TOOLS_LIVE ? '' : id);

  const runnerHref = liveTool.data ? toolHref(liveTool.data) : null;
  const redirect =
    runnerHref && typeof runnerHref === 'object' && 'params' in runnerHref && runnerHref.params?.id !== id
      ? runnerHref
      : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect]);

  // Premium multi-step runners — keep Mood, Journal and Gratitude off ToolRunner.
  if (id === 'mood-check-in' || id === 'daily-mood-check-in') {
    return <MoodCheckinScreen />;
  }
  if (id === 'journal' || id === 'digital-journal') {
    return <JournalScreen />;
  }
  if (id === 'gratitude' || id === 'gratitude-journal') {
    return <GratitudeScreen />;
  }
  if (id === 'water' || id === 'water-intake-tracker') {
    return <WaterIntakeScreen />;
  }
  if (id === 'weight-tracker' || id === 'weight-journey') {
    return <WeightJourneyScreen />;
  }
  if (id === 'nutrition' || id === 'calorie-nutrition-tracker') {
    return <NutritionScreen />;
  }
  if (id === 'career-interest' || id === 'career-interest-test') {
    return <CareerInterestScreen />;
  }
  if (id === 'skills-strengths' || id === 'skills-strengths-assessment') {
    return <SkillsStrengthsScreen />;
  }
  if (id === 'tarot' || id === 'tarot-reflection') {
    return <TarotReflectionScreen />;
  }

  if (local) return <ToolRunnerScreen id={id} />;

  if (TOOLS_LIVE) {
    if (liveTool.isPending || redirect) return <ToolLoadingScreen />;
    if (liveTool.isError || !liveTool.data) {
      return <ToolErrorScreen error={liveTool.error} onRetry={() => void liveTool.refetch()} />;
    }
    if (NATIVE_SCREENS.has(liveTool.data.slug)) return <BmiBmrScreen tool={liveTool.data} />;
    return <WebsiteToolScreen tool={liveTool.data} />;
  }

  const tool = getPreviewTool(id);
  if (!tool) {
    return (
      <Screen scroll contentStyle={styles.content}>
        <AppHeader title="Tool" onBack={() => router.back()} />
        <Text style={styles.subtitle}>Unknown tool.</Text>
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
