import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FullBleedArt, HERO_ART } from '@/features/onboarding/FullBleedArt';
import { useOnboardingNavigation } from '@/features/onboarding/useOnboardingNavigation';
import { customer, customerFonts, shadows } from '@/theme';

const LOGO = require('../../../assets/brand/yuktione-logo-light.png');

const FEATURES = [
  { icon: 'person-outline' as const, label: 'Expert guidance', tint: '#E7F8F0', ink: customer.teal },
  { icon: 'settings-outline' as const, label: 'Practical tools', tint: '#E5F8EF', ink: '#1F9D6A' },
  { icon: 'locate-outline' as const, label: 'Personalised programmes', tint: '#F1ECFF', ink: '#6E5BD6' },
  { icon: 'leaf-outline' as const, label: 'Holistic growth', tint: '#E7F6FB', ink: '#2A9BB5' },
];

type Slide = {
  title: string;
  support: string | null;
  route: '/onboarding/step-1' | '/onboarding/step-2' | '/onboarding/step-3';
  showFeatures?: boolean;
};

/** Same hero art as splash (00) + onboarding 1 for every step. */
const SLIDES: Slide[] = [
  {
    title: 'Real people.\nPractical guidance.\nReal progress.',
    support: null,
    route: '/onboarding/step-1',
  },
  {
    title: 'Small steps.\nBrighter days.',
    support: 'Expert support, personalised tools and programmes — all in one place.',
    route: '/onboarding/step-2',
  },
  {
    title: 'Your wellbeing,\nyour way.',
    support: null,
    route: '/onboarding/step-3',
    showFeatures: true,
  },
];

export function OnboardingFlow({ initialIndex = 0 }: { initialIndex?: 0 | 1 | 2 }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { finishOnboarding, goBack } = useOnboardingNavigation();
  const index = initialIndex;
  const slide: Slide = SLIDES[index]!;
  const logoWidth = Math.min(width * 0.58, 220);

  const next = () => {
    if (index >= SLIDES.length - 1) {
      void finishOnboarding();
      return;
    }
    const nextSlide = SLIDES[index + 1];
    if (!nextSlide) {
      void finishOnboarding();
      return;
    }
    router.push(nextSlide.route);
  };

  return (
    <View style={styles.root}>
      <FullBleedArt source={HERO_ART} />

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topBar}>
          <View style={styles.side} />
          <Image
            source={LOGO}
            style={{ width: logoWidth, height: logoWidth * 0.34 }}
            resizeMode="contain"
            accessibilityLabel="YuktiOne"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={() => void finishOnboarding()}
            hitSlop={10}
            style={styles.skipHit}
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.copy}>
          <Text style={styles.hero} accessibilityRole="header">
            {slide.title}
          </Text>
          {slide.support ? <Text style={styles.support}>{slide.support}</Text> : null}

          {slide.showFeatures ? (
            <View style={styles.features}>
              {FEATURES.map((feature) => (
                <View key={feature.label} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.tint }]}>
                    <Ionicons name={feature.icon} size={18} color={feature.ink} />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.spacer} />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {index > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={20} color={customer.navy} />
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}
          <View
            style={styles.dots}
            accessibilityRole="adjustable"
            accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}
          >
            {SLIDES.map((_, dot) => (
              <View key={dot} style={[styles.dot, dot === index && styles.dotOn]} />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next"
            onPress={next}
            style={styles.next}
          >
            <Ionicons name="arrow-forward" size={22} color={customer.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: customer.canvas,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 48,
  },
  skipHit: {
    minWidth: 48,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: {
    fontFamily: customerFonts.bold,
    color: customer.teal,
    fontSize: 15,
  },
  copy: {
    paddingHorizontal: 28,
    paddingTop: 12,
    alignItems: 'center',
    gap: 14,
  },
  hero: {
    fontFamily: customerFonts.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.3,
    color: customer.navy,
    textAlign: 'center',
    maxWidth: 320,
  },
  support: {
    textAlign: 'center',
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: customer.body,
    maxWidth: 300,
  },
  features: {
    width: '100%',
    maxWidth: 340,
    gap: 10,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontFamily: customerFonts.medium,
    fontSize: 15,
    color: customer.navy,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 48,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(26,43,74,0.22)',
  },
  dotOn: {
    backgroundColor: customer.teal,
    width: 18,
    borderRadius: 4,
  },
  next: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});
