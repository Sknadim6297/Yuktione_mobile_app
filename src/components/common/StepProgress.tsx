import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, radius, spacing, typography } from '@/theme';

export type StepProgressProps = {
  steps: string[];
  currentIndex: number;
};

function Segment({ active }: { active: boolean }) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: motion.duration.normal,
    });
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ scaleY: 0.85 + progress.value * 0.15 }],
    backgroundColor: active
      ? colors.brand.eucalyptus
      : colors.border.subtle,
  }));

  return <Animated.View style={[styles.segment, style]} />;
}

export function StepProgress({ steps, currentIndex }: StepProgressProps) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 1,
        max: steps.length,
        now: currentIndex + 1,
      }}
      accessibilityLabel={`Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex] ?? ''}`}
    >
      <Text style={styles.meta}>
        Step {currentIndex + 1} of {steps.length}
      </Text>
      <Text style={styles.current}>{steps[currentIndex]}</Text>
      <View style={styles.track}>
        {steps.map((step, index) => (
          <Segment key={step} active={index <= currentIndex} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  meta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  current: {
    ...typography.h3,
    color: colors.text.primary,
  },
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
  },
});
