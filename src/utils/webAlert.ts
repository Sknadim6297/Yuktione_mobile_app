import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * React Native's Alert.alert is a no-op on web, so prompts such as
 * "You are logged in on another device. Continue?" silently never appear and
 * the UI looks frozen. This shim maps Alert.alert to window.alert/confirm on web
 * so every existing Alert.alert call in the app works in the browser too.
 * Native (iOS/Android) behaviour is untouched.
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]): void => {
    const text = [title, message].filter(Boolean).join('\n\n');

    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    const cancelButton = buttons.find((button) => button.style === 'cancel');
    const actionButtons = buttons.filter((button) => button !== cancelButton);
    const confirmed = window.confirm(text);

    if (confirmed) {
      // Prefer the last non-cancel button (the primary action in RN alert order).
      actionButtons[actionButtons.length - 1]?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  };
}
