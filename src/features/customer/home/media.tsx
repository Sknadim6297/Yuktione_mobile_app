import { memo, type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BRAND_ASSETS } from '@/constants/brandAssets';
import { customer } from '@/theme';

const NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Remote image with a calm placeholder, a short fade-in and a branded fallback when the
 * URL is missing or fails. Images keep their own colours; nothing is filtered.
 */
export const RemoteImage = memo(function RemoteImage({
  uri,
  style,
  resizeMode = 'cover',
  inset = 0,
  background = customer.cream,
  fallback,
  label,
  children,
}: {
  uri: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  /** Padding around a contained illustration. */
  inset?: number;
  background?: string;
  fallback?: ReactNode;
  /** Set for meaningful images; decorative ones stay silent for screen readers. */
  label?: string;
  children?: ReactNode;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && failedUri !== uri;

  return (
    <View style={[styles.frame, { backgroundColor: background }, style]}>
      {showImage ? (
        <FadeInImage
          key={uri}
          uri={uri!}
          resizeMode={resizeMode}
          inset={inset}
          label={label}
          onError={() => setFailedUri(uri ?? null)}
        />
      ) : (
        fallback ?? <BrandPlaceholder />
      )}
      {children}
    </View>
  );
});

/** Keyed by URI, so each image starts transparent without a reset effect racing its load event. */
function FadeInImage({
  uri,
  resizeMode,
  inset,
  label,
  onError,
}: {
  uri: string;
  resizeMode: ImageResizeMode;
  inset: number;
  label?: string;
  onError: () => void;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  return (
    <Animated.Image
      source={{ uri }}
      resizeMode={resizeMode}
      onLoad={() =>
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: NATIVE_DRIVER,
        }).start()
      }
      onError={onError}
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      style={[styles.fill, { opacity, top: inset, right: inset, bottom: inset, left: inset }]}
    />
  );
}

export function BrandPlaceholder() {
  return (
    <View style={styles.placeholder} accessible={false}>
      <Image source={BRAND_ASSETS.logo} style={styles.lotus} resizeMode="contain" />
    </View>
  );
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [pulse] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[styles.skeleton, { opacity: pulse }, style]} />;
}

/** Card surface with a gentle press response. */
export function PressCard({
  onPress,
  label,
  hint,
  selected,
  style,
  children,
}: {
  onPress: () => void;
  label: string;
  hint?: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      aria-selected={selected}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  lotus: { width: '56%', height: '30%', opacity: 0.35 },
  skeleton: { backgroundColor: customer.line, borderRadius: 12 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
