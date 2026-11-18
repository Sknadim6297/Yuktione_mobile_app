import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { brand, customerFonts } from '@/theme';

type FormInputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  /** Adds a show / hide toggle and masks the value. */
  password?: boolean;
};

/** Website form field: label, silver border, plum focus ring (auth-theme.css). */
export function FormInput({
  label,
  icon,
  error,
  hint,
  password,
  onFocus,
  onBlur,
  ...input
}: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          Boolean(error) && styles.fieldError,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={focused ? brand.plum : brand.grey} />
        ) : null}
        <TextInput
          placeholderTextColor="#9A93A0"
          autoCorrect={false}
          {...input}
          secureTextEntry={password ? !visible : input.secureTextEntry}
          accessibilityLabel={input.accessibilityLabel ?? label ?? input.placeholder}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((value) => !value)}
            hitSlop={10}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={brand.grey}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: customerFonts.semibold, fontSize: 13.5, color: brand.ink },
  field: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.silver,
    backgroundColor: brand.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  fieldFocused: { borderColor: brand.plum, borderWidth: 1.5, backgroundColor: '#FFFDFE' },
  fieldError: { borderColor: '#C4314B' },
  input: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: brand.ink,
    paddingVertical: 12,
  },
  error: { fontFamily: customerFonts.medium, fontSize: 12.5, color: '#C4314B' },
  hint: { fontFamily: customerFonts.regular, fontSize: 12.5, color: brand.grey },
});
