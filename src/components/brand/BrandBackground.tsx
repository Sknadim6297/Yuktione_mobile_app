import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandGradient } from '@/components/brand/BrandGradient';
import { BRAND_ASSETS } from '@/constants/brandAssets';
import { brand, brandGradients } from '@/theme';

/**
 * Website background treatments:
 * - photo: register-hero photography under the plum overlay (.yk-signup__brand)
 * - plum:  solid plum panel gradient without photography
 * - soft:  cream hero wash with two soft glows (.yk-hero--soft)
 */
export function BrandBackground({
  variant,
  children,
  style,
}: {
  variant: 'photo' | 'plum' | 'soft';
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.root, variant === 'soft' ? styles.soft : styles.plum, style]}>
      {variant === 'photo' ? (
        <>
          <BrandGradient colors={brandGradients.panel} angle={145} />
          <Image
            source={BRAND_ASSETS.registerHero}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <BrandGradient colors={brandGradients.photoOverlay} angle={180} />
        </>
      ) : null}
      {variant === 'plum' ? <BrandGradient colors={brandGradients.panel} angle={145} /> : null}
      {variant === 'soft' ? (
        <>
          <BrandGradient colors={brandGradients.heroSoft} angle={180} />
          <View pointerEvents="none" style={[styles.glow, styles.glowA]} />
          <View pointerEvents="none" style={[styles.glow, styles.glowB]} />
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  plum: { backgroundColor: brand.plum },
  soft: { backgroundColor: brand.heroCream },
  glow: { position: 'absolute', borderRadius: 999 },
  glowA: {
    width: 260,
    height: 260,
    left: -90,
    top: -60,
    backgroundColor: 'rgba(195, 25, 107, 0.07)',
  },
  glowB: {
    width: 220,
    height: 220,
    right: -80,
    bottom: -40,
    backgroundColor: 'rgba(184, 115, 51, 0.08)',
  },
});
