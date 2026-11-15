import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/motion';
import { colors, motion, spacing } from '@/theme';

export type OnboardingFooterProps = {
  /** Zero-based active page among totalDots. */
  activeIndex: number;
  totalDots?: number;
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  /** Draw the upward cream wave that overlaps the illustration. */
  showCurve?: boolean;
};

function PaginationDot({ active }: { active: boolean }) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: motion.duration.normal,
    });
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [8, 10]),
    height: interpolate(progress.value, [0, 1], [8, 10]),
    borderRadius: interpolate(progress.value, [0, 1], [4, 5]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border.default, colors.brand.eucalyptus],
    ),
  }));

  return <Animated.View style={style} />;
}

export function OnboardingFooter({
  activeIndex,
  totalDots = 2,
  onBack,
  onNext,
  backDisabled = false,
  showCurve = true,
}: OnboardingFooterProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const curveHeight = Math.max(36, Math.round(width * 0.08));

  return (
    <View style={styles.shell}>
      {showCurve ? (
        <View style={[styles.curveWrap, { height: curveHeight }]} pointerEvents="none">
          <Svg width={width} height={curveHeight} viewBox={`0 0 ${width} ${curveHeight}`}>
            <Path
              d={`M0 ${curveHeight} L0 ${curveHeight * 0.55} Q ${width / 2} 0 ${width} ${curveHeight * 0.55} L${width} ${curveHeight} Z`}
              fill={colors.background.canvas}
            />
          </Svg>
        </View>
      ) : null}

      <View
        style={[
          styles.wrap,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityState={{ disabled: backDisabled }}
          disabled={backDisabled}
          hitSlop={8}
          scaleTo={motion.press.in}
          onPress={onBack}
          style={[styles.backBtn, backDisabled && styles.backDisabled]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.secondary} />
        </PressableScale>

        <View
          style={styles.dots}
          accessibilityRole="adjustable"
          accessibilityLabel={`Page ${activeIndex + 1} of ${totalDots}`}
        >
          {Array.from({ length: totalDots }).map((_, index) => (
            <PaginationDot key={`dot-${index}`} active={index === activeIndex} />
          ))}
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Continue"
          hitSlop={8}
          scaleTo={motion.press.in}
          onPress={onNext}
          style={styles.nextBtn}
        >
          <Ionicons name="arrow-forward" size={22} color={colors.text.inverse} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background.canvas,
  },
  curveWrap: {
    marginTop: -1,
    backgroundColor: 'transparent',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.canvas,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backDisabled: {
    opacity: 0.45,
  },
  nextBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.eucalyptus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
});
