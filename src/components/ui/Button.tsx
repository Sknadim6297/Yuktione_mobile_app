import { PrimaryButton, SecondaryButton } from '@/components/brand/BrandButtons';
import type { StyleProp, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Legacy form button — renders the website pill buttons so every screen shares one style. */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  onPress,
  style,
  testID,
}: ButtonProps) {
  const Base = variant === 'primary' ? PrimaryButton : SecondaryButton;
  return (
    <Base
      label={title}
      loading={loading}
      disabled={disabled}
      onPress={onPress ?? (() => undefined)}
      testID={testID}
      style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'center' }, style]}
    />
  );
}
