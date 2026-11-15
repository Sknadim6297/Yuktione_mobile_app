import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import {
  getTourIndex,
  openTourScreen,
  SCREEN_TOUR,
} from '@/features/preview/screenTour';
import { colors, fontFamilies, radius, shadows, spacing } from '@/theme';

/**
 * Floating prev / next / list controls for frontend-only screen walkthrough.
 */
export function ScreenTourBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!FRONTEND_ONLY) {
    return null;
  }

  // Hide on the gallery list itself
  if (pathname === '/gallery' || pathname.startsWith('/gallery')) {
    return null;
  }

  const index = getTourIndex(pathname);
  const current = index >= 0 ? SCREEN_TOUR[index] : null;
  const prev = index > 0 ? SCREEN_TOUR[index - 1] : null;
  const next =
    index >= 0 && index < SCREEN_TOUR.length - 1 ? SCREEN_TOUR[index + 1] : null;

  const go = (screen: (typeof SCREEN_TOUR)[number] | null | undefined) => {
    if (!screen) {
      return;
    }
    openTourScreen(screen);
    router.push(screen.href);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, spacing.sm) + 56 }]}
    >
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous screen"
          disabled={!prev}
          onPress={() => go(prev)}
          style={[styles.btn, !prev && styles.btnDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={prev ? colors.text.inverse : colors.text.muted}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open screen list"
          onPress={() => router.push('/gallery')}
          style={styles.center}
        >
          <Text style={styles.label} numberOfLines={1}>
            {current
              ? `${current.number} · ${current.title}`
              : 'Screen tour'}
          </Text>
          <Text style={styles.hint}>Tap for list</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next screen"
          disabled={!next}
          onPress={() => go(next)}
          style={[styles.btn, !next && styles.btnDisabled]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={next ? colors.text.inverse : colors.text.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.navy,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    ...shadows.md,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  hint: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
  },
});
