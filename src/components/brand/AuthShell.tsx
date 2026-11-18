import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandBackground } from '@/components/brand/BrandBackground';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { brand, customerFonts } from '@/theme';

/** Below this window height the fixed layout drops the band points and tightens the card. */
const COMPACT_HEIGHT = 760;

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/**
 * Website auth layout (register.blade.php, mobile breakpoint):
 * register-hero photo band under the plum overlay, then a white card that
 * overlaps the band by 2rem with a 22px radius.
 *
 * `fixed` pins the layout to the screen without scrolling: the photo band
 * absorbs the spare height and collapses while the keyboard is open.
 */
export function AuthShell({
  headline,
  accent,
  points,
  badge,
  title,
  lead,
  onBack,
  children,
  footer,
  fixed = false,
}: {
  headline: string;
  accent?: string;
  points?: string[];
  badge?: string;
  title: string;
  lead?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  fixed?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const cardWidth = Math.min(width - 32, 440);
  const compact = fixed && height < COMPACT_HEIGHT;
  const showPoints = Boolean(points?.length) && !compact;

  const backButton = onBack ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onBack}
      hitSlop={8}
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={22} color={brand.white} />
    </Pressable>
  ) : null;

  const bandCopy = (
    <>
      <Text style={[styles.headline, compact && styles.headlineCompact]} accessibilityRole="header">
        {headline}
        {accent ? (
          <>
            {' '}
            <Text style={styles.headlineAccent}>{accent}</Text>
          </>
        ) : null}
      </Text>
      {showPoints ? (
        <View style={styles.points}>
          {points!.map((point) => (
            <View key={point} style={styles.point}>
              <View style={styles.pointIcon}>
                <Ionicons name="checkmark" size={12} color={brand.white} />
              </View>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  const card = (
    <View style={[styles.card, compact && styles.cardCompact, { width: cardWidth }]}>
      <View style={[styles.logo, compact && styles.logoCompact]}>
        <BrandLogo width={compact ? 124 : 150} />
      </View>
      {badge && !compact ? <Text style={styles.badge}>{badge}</Text> : null}
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {lead ? <Text style={styles.lead}>{lead}</Text> : null}
      <View style={[styles.body, compact && styles.bodyCompact]}>{children}</View>
    </View>
  );

  if (fixed) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.fixedRoot}>
          <BrandBackground
            variant="photo"
            style={[styles.fixedBand, { minHeight: insets.top + (onBack ? 92 : 72) }]}
          >
            <View style={[styles.fixedBandInner, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
              {backButton}
              {keyboardVisible ? null : <View style={styles.fixedCopy}>{bandCopy}</View>}
            </View>
          </BrandBackground>
          {card}
          {footer ? (
            <View
              style={[
                styles.footer,
                compact && styles.footerCompact,
                { width: cardWidth, paddingBottom: Math.max(insets.bottom, 12) + 4 },
              ]}
            >
              {footer}
            </View>
          ) : (
            <View style={{ height: Math.max(insets.bottom, 12) + 4 }} />
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  const bandHeight = Math.round(Math.max(230, Math.min(height * 0.34, 320))) + insets.top;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}
      >
        <BrandBackground variant="photo" style={[styles.band, { height: bandHeight }]}>
          <View style={[styles.bandInner, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
            {backButton ?? <View style={styles.backSpacer} />}
            {bandCopy}
          </View>
        </BrandBackground>
        {card}
        {footer ? <View style={[styles.footer, { width: cardWidth }]}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.pearl },
  scroll: { flexGrow: 1, alignItems: 'center' },
  band: { width: '100%' },
  bandInner: { flex: 1, paddingHorizontal: 22, paddingBottom: 48, gap: 14 },
  fixedRoot: { flex: 1, alignItems: 'center', overflow: 'hidden' },
  fixedBand: { width: '100%', flex: 1, flexShrink: 1, overflow: 'hidden' },
  fixedBandInner: { flex: 1, paddingHorizontal: 22, paddingBottom: 46 },
  fixedCopy: { flex: 1, justifyContent: 'flex-end', gap: 12, paddingTop: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { height: 8 },
  headline: {
    fontFamily: customerFonts.bold,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.7,
    color: brand.white,
    maxWidth: 360,
  },
  headlineCompact: { fontSize: 21, lineHeight: 26 },
  headlineAccent: {
    color: brand.white,
    textDecorationLine: 'underline',
    textDecorationColor: brand.underline,
    textDecorationStyle: 'solid',
  },
  points: { gap: 9 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { fontFamily: customerFonts.semibold, fontSize: 13.5, color: brand.white },
  card: {
    marginTop: -32,
    backgroundColor: brand.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    shadowColor: '#1E1428',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 8,
  },
  cardCompact: { paddingTop: 16, paddingBottom: 16 },
  logo: { alignItems: 'center', marginBottom: 6 },
  logoCompact: { marginBottom: 2 },
  badge: {
    alignSelf: 'center',
    fontFamily: customerFonts.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: brand.plum,
    backgroundColor: brand.plumSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontFamily: customerFonts.bold,
    fontSize: 24,
    letterSpacing: -0.7,
    color: brand.ink,
  },
  titleCompact: { fontSize: 21 },
  lead: {
    textAlign: 'center',
    marginTop: 6,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: brand.grey,
  },
  body: { marginTop: 18, gap: 14 },
  bodyCompact: { marginTop: 12, gap: 10 },
  footer: { marginTop: 16, alignItems: 'center' },
  footerCompact: { marginTop: 10 },
});
