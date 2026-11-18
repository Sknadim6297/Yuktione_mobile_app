import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

import { BrandGradient, BrandLogo, Eyebrow, SecondaryButton } from '@/components/brand';
import { BRAND_ASSETS } from '@/constants/brandAssets';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { brand, customerFonts, motion } from '@/theme';

const PROMISES = ['Verified experts', 'Practical tools', 'Private & secure'] as const;

/**
 * Screen 01 — Splash. The website home hero poster as a full-bleed photograph
 * under a plum scrim, with the official logo and the hero headline.
 */
export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const logoReveal = useSharedValue(reduceMotion ? 1 : 0);
  const photo = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      entrance.value = 1;
      logoReveal.value = 1;
      photo.value = 1;
      return;
    }
    photo.value = withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) });
    logoReveal.value = withDelay(120, withSpring(1, motion.spring.soft));
    entrance.value = withDelay(
      260,
      withTiming(1, { duration: motion.duration.entrance + 240, easing: Easing.out(Easing.cubic) }),
    );
  }, [entrance, logoReveal, photo, reduceMotion]);

  const photoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(photo.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(photo.value, [0, 1], [1.08, 1]) }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoReveal.value,
    transform: [{ translateY: interpolate(logoReveal.value, [0, 1], [-motion.offset.soft, 0]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [motion.offset.medium, 0]) }],
  }));

  const compact = height < 700;
  const contentWidth = Math.min(width - 48, 480);

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
        <Image
          source={BRAND_ASSETS.heroPoster}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel="A woman with her eyes closed, face lifted toward warm sunlight"
        />
      </Animated.View>
      <BrandGradient
        colors={['rgba(26, 10, 20, 0.45)', 'rgba(26, 10, 20, 0)']}
        style={[styles.topScrim, { height: insets.top + 140 }]}
      />
      <BrandGradient
        colors={[
          'rgba(90, 9, 50, 0)',
          'rgba(90, 9, 50, 0.55)',
          'rgba(74, 7, 41, 0.9)',
          'rgba(58, 5, 32, 0.97)',
        ]}
        style={[styles.bottomScrim, { height: height * (compact ? 0.72 : 0.64) }]}
      />

      <View
        style={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
      >
        <Animated.View style={[styles.logoPill, logoStyle]}>
          <BrandLogo width={compact ? 128 : 148} />
        </Animated.View>

        <Animated.View style={[styles.bottom, { width: contentWidth }, contentStyle]}>
          <Eyebrow label="Your everyday growth partner" inverse />
          <Text
            style={[styles.title, compact && styles.titleCompact]}
            accessibilityRole="header"
          >
            Feel Better. Grow Further.{'\n'}Make <Text style={styles.accent}>Better Choices.</Text>
          </Text>
          <Text style={styles.lead}>
            Expert guidance, practical tools and a supportive community for your mind, body,
            career, business and life.
          </Text>

          <View style={styles.promises}>
            {PROMISES.map((item) => (
              <View key={item} style={styles.promise}>
                <Ionicons name="checkmark-circle" size={14} color={brand.underline} />
                <Text style={styles.promiseText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <SecondaryButton
              label="Get Started"
              icon="arrow-forward"
              iconPosition="end"
              onPress={() => router.push('/onboarding/step-1')}
              accessibilityHint="Opens onboarding"
              style={styles.cta}
            />
            <Text style={styles.signIn} onPress={() => router.push('/auth')} accessibilityRole="link">
              Already have an account? <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.plumDeep, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  topScrim: { top: 0, bottom: 'auto' },
  bottomScrim: { top: 'auto', bottom: 0 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  logoPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#1E1428',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  bottom: { gap: 12 },
  title: {
    fontFamily: customerFonts.bold,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -1,
    color: brand.white,
  },
  titleCompact: { fontSize: 27, lineHeight: 32 },
  accent: { color: brand.underline },
  lead: {
    fontFamily: customerFonts.medium,
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.86)',
  },
  promises: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  promise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  promiseText: { fontFamily: customerFonts.semibold, fontSize: 12, color: brand.white },
  actions: { gap: 12, marginTop: 10 },
  cta: { borderColor: brand.white },
  signIn: {
    textAlign: 'center',
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.82)',
    paddingVertical: 4,
  },
  signInLink: { fontFamily: customerFonts.bold, color: brand.white, textDecorationLine: 'underline' },
});
