import { useEffect, useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { ShakeView } from '@/components/motion';
import { brand, customerFonts } from '@/theme';

const OTP_LENGTH = 6;
const GAP = 8;
/** Auth card: window − 32 (max 440), minus its 20px side padding. */
const CARD_PADDING = 40;

export type OtpCodeInputProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
};

function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

function OtpCursor() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0, { duration: 530 }), -1, true);
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.cursor, style]} />;
}

function OtpCell({
  digit,
  active,
  hasError,
  showCursor,
  size,
}: {
  digit: string;
  active: boolean;
  hasError: boolean;
  showCursor: boolean;
  size: number;
}) {
  const filled = digit.trim().length > 0;
  return (
    <View
      style={[
        styles.cell,
        { width: size, height: Math.round(size * 1.15) },
        filled && styles.cellFilled,
        active && styles.cellActive,
        hasError && styles.cellError,
      ]}
    >
      {filled ? <Text style={styles.cellText}>{digit}</Text> : showCursor ? <OtpCursor /> : null}
    </View>
  );
}

export function OtpCodeInput({ value, onChange, disabled = false, error, autoFocus = true }: OtpCodeInputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const { width } = useWindowDimensions();
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const available = Math.min(width - 32, 440) - CARD_PADDING - GAP * (OTP_LENGTH - 1);
  const size = Math.max(36, Math.min(52, Math.floor(available / OTP_LENGTH)));

  const focusHidden = () => {
    if (!disabled) inputRef.current?.focus();
  };

  return (
    <View style={styles.wrap}>
      <ShakeView trigger={error}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="One-time verification code"
          accessibilityHint="Enter the 6 digit code sent to your email"
          onPress={focusHidden}
          style={styles.cellsRow}
        >
          {digits.map((digit, index) => {
            const isActive =
              !disabled &&
              ((value.length < OTP_LENGTH && index === activeIndex) ||
                (value.length === OTP_LENGTH && index === OTP_LENGTH - 1));
            const showCursor = !disabled && value.length < OTP_LENGTH && index === value.length;
            return (
              <OtpCell
                key={`otp-cell-${index}`}
                digit={digit}
                active={isActive}
                hasError={Boolean(error)}
                showCursor={showCursor}
                size={size}
              />
            );
          })}
        </Pressable>
      </ShakeView>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(sanitizeDigits(text))}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        maxLength={OTP_LENGTH}
        caretHidden
        autoFocus={autoFocus}
        editable={!disabled}
        style={styles.hiddenInput}
        accessibilityLabel="OTP code entry"
        accessibilityHint="Six digit numeric code"
      />

      {error ? (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 10, alignItems: 'center' },
  cellsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: GAP },
  cell: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: brand.silver,
    backgroundColor: brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: { borderColor: brand.plumSoftDeep, backgroundColor: brand.plumSoft },
  cellActive: { borderColor: brand.plum, backgroundColor: '#FFFDFE' },
  cellError: { borderColor: '#C4314B', backgroundColor: '#FFF7F8' },
  cellText: { fontFamily: customerFonts.bold, fontSize: 22, lineHeight: 28, color: brand.ink },
  cursor: { width: 2, height: 22, borderRadius: 1, backgroundColor: brand.plum },
  hiddenInput: { position: 'absolute', opacity: 0.02, height: 1, width: 1, left: 0, top: 0 },
  error: { textAlign: 'center', fontFamily: customerFonts.medium, fontSize: 12.5, color: '#C4314B' },
});
