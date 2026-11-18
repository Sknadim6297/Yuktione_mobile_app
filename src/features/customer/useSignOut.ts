import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { customerActions } from '@/features/customer/store';
import { logoutCustomer } from '@/services/api/auth';

/**
 * Ends the Sanctum session, wipes this person's device data and cached profile,
 * then returns to sign-in. Shared by My Space, Security and the app menu.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const signOutNow = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutCustomer();
    } finally {
      customerActions.signOut();
      queryClient.removeQueries({ queryKey: ['v1', 'profile'] });
      queryClient.removeQueries({ queryKey: ['v1', 'my'] });
      setBusy(false);
      router.replace('/auth');
    }
  }, [busy, queryClient]);

  const confirmSignOut = useCallback(() => {
    Alert.alert(
      'Sign out of YuktiOne?',
      'Moods, saved items and other data kept on this device for your account will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void signOutNow() },
      ],
    );
  }, [signOutNow]);

  return { busy, signOutNow, confirmSignOut };
}
