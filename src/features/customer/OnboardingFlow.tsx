import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BrandBackground,
  BrandLogo,
  Eyebrow,
  FocalImage,
  PrimaryButton,
} from '@/components/brand';
import { FadeInView } from '@/components/motion';
import { BRAND_ASSETS, PROGRAMME_IMAGES } from '@/constants/brandAssets';
import { useOnboardingNavigation } from '@/features/onboarding/useOnboardingNavigation';
import { brand, customer, customerFonts, shadows } from '@/theme';

const FEATURES = [
  { icon: 'people-outline' as const, label: 'Expert guidance', hint: 'Verified professionals' },
  { icon: 'grid-outline' as const, label: 'Practical tools', hint: 'Mood, journal, career & more' },
  { icon: 'layers-outline' as const, label: 'Personalised programmes', hint: 'Guided journeys' },
  { icon: 'leaf-outline' as const, label: 'Holistic growth', hint: 'Mind, body, career, life' },
];

type Slide = {
  eyebrow: string;
  title: string;
  accent: string;
  support: string | null;
  image: ImageSourcePropType;
  imageLabel: string;
  /** Transparent cut-out art is contained on a white card instead of cropped. */
  cutout?: boolean;
  aspectRatio?: number;
  focalX?: number;
  focalY?: number;
  route: '/onboarding/step-1' | '/onboarding/step-2' | '/onboarding/step-3';
  showFeatures?: boolean;
};

const SLIDES: Slide[] = [
  {
    eyebrow: 'Talk to an expert',
    title: 'Real people.\nPractical guidance.',
    accent: 'Real progress.',
    support: 'Connect with verified psychologists, coaches and guides who listen first.',
    image: BRAND_ASSETS.registerHero,
    imageLabel: 'A counsellor in conversation with a client',
    focalX: 0.86,
    focalY: 0.4,
    route: '/onboarding/step-1',
  },
  {
    eyebrow: 'Tools for every day',
    title: 'Small steps.',
    accent: 'Brighter days.',
    support: 'Expert support, personalised tools and programmes — all in one place.',
    image: BRAND_ASSETS.expertsHero,
    imageLabel: 'A smiling woman surrounded by wellbeing, health, growth and mind icons',
    cutout: true,
    route: '/onboarding/step-2',
  },
  {
    eyebrow: 'Made for you',
    title: 'Your wellbeing,',
    accent: 'your way.',
    support: null,
    image: PROGRAMME_IMAGES.calm,
    imageLabel: 'A woman meditating in a calm, sunlit room',
    aspectRatio: 2,
    focalX: 0.5,
    focalY: 0.3,
    route: '/onboarding/step-3',
    showFeatures: true,
  },
];

export function OnboardingFlow({ initialIndex = 0 }: { initialIndex?: 0 | 1 | 2 }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { finishOnboarding, goBack } = useOnboardingNavigation();
  const index = initialIndex;
  const slide: Slide = SLIDES[index]!;
  const isLast = index >= SLIDES.length - 1;
  const contentWidth = Math.min(width, 520);
  const imageHeight = Math.round(
    Math.max(180, Math.min(height * (slide.showFeatures ? 0.24 : 0.38), 360)),
  );

  const next = () => {
    const nextSlide = SLIDES[index + 1];
    if (isLast || !nextSlide) {
      void finishOnboarding();
      return;
    }
    router.push(nextSlide.route);
  };

  return (
    <BrandBackground variant="soft" style={styles.root}>
      <View style={[styles.frame, { width: contentWidth, paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topBar}>
          {index > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              hitSlop={8}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={20} color={customer.navy} />
            </Pressable>
          ) : (
            <View style={styles.side} />
          )}
          <BrandLogo width={Math.min(width * 0.4, 150)} />
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

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <FadeInView key={slide.route}>
            <View
              style={[
                styles.imageCard,
                slide.cutout && styles.imageCardCutout,
                { height: imageHeight },
              ]}
            >
              {slide.cutout ? (
                <Image
                  source={slide.image}
                  style={styles.cutoutImage}
                  resizeMode="contain"
                  accessibilityLabel={slide.imageLabel}
                />
              ) : (
                <FocalImage
                  source={slide.image}
                  aspectRatio={slide.aspectRatio ?? 1.5}
                  focalX={slide.focalX}
                  focalY={slide.focalY}
                  style={StyleSheet.absoluteFill}
                  accessibilityLabel={slide.imageLabel}
                />
              )}
            </View>
          </FadeInView>

          <FadeInView key={`${slide.route}-copy`} delayMs={60} style={styles.copy}>
            <Eyebrow label={slide.eyebrow} />
            <Text style={styles.hero} accessibilityRole="header">
              {slide.title}
              {'\n'}
              <Text style={styles.heroAccent}>{slide.accent}</Text>
            </Text>
            {slide.support ? <Text style={styles.support}>{slide.support}</Text> : null}

            {slide.showFeatures ? (
              <View style={styles.features}>
                {FEATURES.map((feature) => (
                  <View key={feature.label} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <Ionicons name={feature.icon} size={18} color={brand.plum} />
                    </View>
                    <View style={styles.featureCopy}>
                      <Text style={styles.featureLabel}>{feature.label}</Text>
                      <Text style={styles.featureHint}>{feature.hint}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={brand.magenta} />
                  </View>
                ))}
              </View>
            ) : null}
          </FadeInView>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View
            style={styles.dots}
            accessibilityRole="adjustable"
            accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}
          >
            {SLIDES.map((_, dot) => (
              <View key={dot} style={[styles.dot, dot === index && styles.dotOn]} />
            ))}
          </View>
          <PrimaryButton
            label={isLast ? 'Get Started' : 'Next'}
            icon="arrow-forward"
            iconPosition="end"
            onPress={next}
            style={styles.nextButton}
          />
        </View>
      </View>
    </BrandBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  frame: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: { width: 48 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: customer.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipHit: { minWidth: 48, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skip: { fontFamily: customerFonts.bold, color: brand.plum, fontSize: 15 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 20 },
  imageCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: brand.plumSoft,
    ...shadows.md,
  },
  imageCardCutout: {
    backgroundColor: brand.white,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: brand.plumSoftDeep,
  },
  cutoutImage: { width: '100%', height: '100%' },
  copy: { gap: 12, paddingHorizontal: 4 },
  hero: {
    fontFamily: customerFonts.bold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.9,
    color: '#111111',
  },
  heroAccent: { color: brand.plum },
  support: {
    fontFamily: customerFonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: customer.body,
  },
  features: { gap: 10, marginTop: 2 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: brand.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...shadows.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plumSoft,
  },
  featureCopy: { flex: 1, gap: 1 },
  featureLabel: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  featureHint: { fontFamily: customerFonts.regular, fontSize: 12.5, color: customer.muted },
  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: brand.plumSoftDeep },
  dotOn: { backgroundColor: brand.plum, width: 22 },
  nextButton: { alignSelf: 'stretch' },
});
