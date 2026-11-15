import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/motion';
import { FullBleedArt, HERO_ART } from '@/features/onboarding/FullBleedArt';
import { OnboardingFooter } from '@/features/onboarding/OnboardingFooter';
import { ONBOARDING_STEP_COUNT } from '@/features/onboarding/content';
import { customer, customerFonts, motion } from '@/theme';

const LOGO = require('../../../assets/brand/yuktione-logo-light.png');

export type OnboardingSlideProps = {
  heading: string;
  description: string;
  illustration?: ImageSourcePropType;
  illustrationLabel: string;
  activeIndex: number;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
};

/** Classic onboarding — same full-bleed hero as splash / steps 1–3. */
export function OnboardingSlide({
  heading,
  description,
  illustration = HERO_ART,
  illustrationLabel,
  activeIndex,
  onSkip,
  onBack,
  onNext,
  backDisabled = false,
}: OnboardingSlideProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(width * 0.58, 220);

  return (
    <View style={styles.root}>
      <FullBleedArt source={illustration} label={illustrationLabel} />

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.topBar}>
          <View style={styles.side} />
          <Image
            source={LOGO}
            style={{ width: logoWidth, height: logoWidth * 0.34 }}
            resizeMode="contain"
            accessibilityLabel="YuktiOne"
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={12}
            scaleTo={motion.press.in}
            onPress={onSkip}
            style={styles.skipHit}
          >
            <Text style={styles.skip}>Skip</Text>
          </PressableScale>
        </View>

        <View style={styles.copy}>
          <Text style={styles.heading} maxFontSizeMultiplier={1.35} accessibilityRole="header">
            {heading}
          </Text>
          <Text style={styles.description} maxFontSizeMultiplier={1.4}>
            {description}
          </Text>
        </View>

        <View style={styles.spacer} />

        <OnboardingFooter
          activeIndex={activeIndex}
          totalDots={ONBOARDING_STEP_COUNT}
          onBack={onBack}
          onNext={onNext}
          backDisabled={backDisabled}
          showCurve={false}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
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
    fontSize: 15,
    color: customer.teal,
  },
  copy: {
    paddingHorizontal: 28,
    paddingTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  heading: {
    fontFamily: customerFonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: customer.navy,
    textAlign: 'center',
    maxWidth: 320,
  },
  description: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: customer.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  spacer: {
    flex: 1,
  },
});
