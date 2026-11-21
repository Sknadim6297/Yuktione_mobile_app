import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { toolPalette } from '@/theme';

/** Lightweight 3D-inspired glass that fills from server totals (0–100+%). */
export function WaterGlass({
  percent,
  celebrate,
}: {
  percent: number;
  celebrate?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const fill = useSharedValue(0);
  const wave = useSharedValue(0);
  const glow = useSharedValue(0);

  const clamped = Math.max(0, Math.min(percent, 120));
  const fillRatio = Math.min(clamped / 100, 1);

  useEffect(() => {
    fill.value = withTiming(fillRatio, {
      duration: reduceMotion ? 0 : 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [fill, fillRatio, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || fillRatio <= 0) {
      wave.value = 0;
      return;
    }
    wave.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [fillRatio, reduceMotion, wave]);

  useEffect(() => {
    if (reduceMotion || !celebrate) {
      glow.value = 0;
      return;
    }
    glow.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      4,
      true,
    );
  }, [celebrate, glow, reduceMotion]);

  const waterStyle = useAnimatedStyle(() => {
    const height = 8 + fill.value * 168;
    const shift = (wave.value - 0.5) * 6;
    return {
      height,
      transform: [{ translateX: shift }],
    };
  });

  const rimStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.45,
  }));

  return (
    <View style={styles.wrap} accessibilityLabel={`Hydration glass ${Math.round(percent)} percent`}>
      <Animated.View style={[styles.rimGlow, rimStyle]} />
      <View style={styles.glass}>
        <View style={styles.inner}>
          <Animated.View style={[styles.water, waterStyle]}>
            <View style={styles.waveTop} />
            <View style={styles.highlight} />
          </Animated.View>
        </View>
        <View style={styles.shine} pointerEvents="none" />
        <View style={styles.base} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 240,
  },
  rimGlow: {
    position: 'absolute',
    top: 8,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: toolPalette.mint,
  },
  glass: {
    width: 132,
    height: 210,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: 'rgba(54, 135, 127, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    shadowColor: toolPalette.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  inner: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(232, 243, 241, 0.55)',
    justifyContent: 'flex-end',
  },
  water: {
    width: '118%',
    marginLeft: '-9%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: toolPalette.teal,
    overflow: 'hidden',
  },
  waveTop: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  highlight: {
    position: 'absolute',
    left: '18%',
    top: 18,
    width: 18,
    bottom: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  shine: {
    position: 'absolute',
    top: 18,
    left: 16,
    width: 18,
    height: 88,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  base: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 6,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 43, 77, 0.08)',
  },
});
