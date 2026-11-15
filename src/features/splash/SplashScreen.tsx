import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/motion';
import { FullBleedArt, HERO_ART } from '@/features/onboarding/FullBleedArt';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { customer, motion, shadows, spacing } from '@/theme';

const BRAND_LOGO = require('../../../assets/brand/yuktione-logo-light.png');

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const logoReveal = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      entrance.value = 1;
      logoReveal.value = 1;
      return;
    }
    entrance.value = withDelay(
      60,
      withTiming(1, {
        duration: motion.duration.entrance + 180,
        easing: Easing.out(Easing.cubic),
      }),
    );
    logoReveal.value = withDelay(120, withSpring(1, motion.spring.soft));
  }, [entrance, logoReveal, reduceMotion]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoReveal.value,
    transform: [
      {
        translateY: interpolate(logoReveal.value, [0, 1], [motion.offset.soft, 0]),
      },
      { scale: interpolate(logoReveal.value, [0, 1], [0.94, 1]) },
    ],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      {
        translateY: interpolate(entrance.value, [0, 1], [motion.offset.soft, 0]),
      },
    ],
  }));

  const logoWidth = Math.min(width * 0.68, 280);

  return (
    <View style={styles.root}>
      <FullBleedArt source={HERO_ART} label="Woman meditating by a calm lake at sunrise" />

      <View style={[styles.brandBlock, { paddingTop: Math.max(insets.top, 12) + 20 }]}>
        <Animated.Image
          source={BRAND_LOGO}
          style={[
            styles.logo,
            { width: logoWidth, height: logoWidth * 0.34 },
            logoStyle,
          ]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel="YuktiOne"
          accessibilityRole="image"
        />
      </View>

      <Animated.View
        style={[
          styles.ctaWrap,
          { paddingBottom: Math.max(insets.bottom, 18) + 12 },
          ctaStyle,
        ]}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityHint="Opens onboarding"
          hitSlop={14}
          scaleTo={motion.press.deep}
          onPress={() => router.push('/onboarding/step-1')}
          style={styles.ctaButton}
        >
          <Ionicons name="arrow-forward" size={24} color={customer.white} />
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: customer.canvas,
    overflow: 'hidden',
  },
  brandBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    zIndex: 2,
  },
  logo: {
    maxWidth: '100%',
  },
  ctaWrap: {
    marginTop: 'auto',
    alignItems: 'center',
    zIndex: 3,
  },
  ctaButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});
