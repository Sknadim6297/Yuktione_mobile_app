import { useEffect, useRef, type ComponentRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { FormErrorMessage } from '@/components/ui';
import { ShakeView } from '@/components/motion';
import { colors, fontFamilies, motion, radius, spacing } from '@/theme';

const OTP_LENGTH = 6;

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
    opacity.value = withRepeat(
      withTiming(0, { duration: 530 }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.cursor, style]} />;
}

function OtpCell({
  digit,
  active,
  hasError,
  showCursor,
  cellSize,
}: {
  digit: string;
  active: boolean;
  hasError: boolean;
  showCursor: boolean;
  cellSize: number;
}) {
  const filled = digit.trim().length > 0;
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(
      hasError
        ? colors.status.error
        : active
          ? colors.brand.eucalyptus
          : colors.border.default,
      { duration: motion.duration.fast },
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
        },
        style,
      ]}
    >
      {filled ? (
        <Text style={styles.cellText}>{digit}</Text>
      ) : showCursor ? (
        <OtpCursor />
      ) : null}
    </Animated.View>
  );
}

export function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  error,
  autoFocus = true,
}: OtpCodeInputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const { width } = useWindowDimensions();
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const horizontalPad = spacing.xxl * 2;
  const gaps = spacing.sm * (OTP_LENGTH - 1);
  const available = Math.max(240, width - horizontalPad - gaps);
  const cellSize = Math.min(52, Math.floor(available / OTP_LENGTH));

  const focusHidden = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={styles.wrap}>
      <ShakeView trigger={error}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="One-time verification code"
          accessibilityHint="Enter the 6 digit code sent to your email"
          onPress={focusHidden}
          style={[styles.cellsRow, { gap: spacing.sm }]}
        >
          {digits.map((digit, index) => {
            const isActiveSlot =
              !disabled &&
              ((value.length < OTP_LENGTH && index === activeIndex) ||
                (value.length === OTP_LENGTH && index === OTP_LENGTH - 1));
            const showCursor =
              !disabled &&
              value.length < OTP_LENGTH &&
              index === value.length;

            return (
              <OtpCell
                key={`otp-cell-${index}`}
                digit={digit}
                active={isActiveSlot}
                hasError={Boolean(error)}
                showCursor={showCursor}
                cellSize={cellSize}
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

      <FormErrorMessage message={error} style={styles.errorCenter} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cell: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text.primary,
  },
  cursor: {
    width: 2,
    height: 22,
    borderRadius: 1,
    backgroundColor: colors.brand.eucalyptus,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.02,
    height: 1,
    width: 1,
    left: 0,
    top: 0,
  },
  errorCenter: {
    textAlign: 'center',
  },
});
