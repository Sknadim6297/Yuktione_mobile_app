import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { customerActions } from '@/features/customer/store';
import { logoutCustomer } from '@/services/api/auth';

const SIGN_OUT_TITLE = 'Sign out of YuktiOne?';
const SIGN_OUT_BODY = 'Moods, saved items and other data kept on this device for your account will be cleared.';

/** Every cache entry that belongs to the signed-in account. */
const isAccountQuery = ({ queryKey }: { queryKey: QueryKey }) =>
  queryKey[0] === 'v1' && (queryKey[1] === 'profile' || queryKey[1] === 'my');

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
      await queryClient.cancelQueries({ predicate: isAccountQuery });
      await logoutCustomer();
    } finally {
      customerActions.signOut();
      queryClient.removeQueries({ predicate: isAccountQuery });
      setBusy(false);
      router.replace('/auth');
    }
  }, [busy, queryClient]);

  const confirmSignOut = useCallback(() => {
    // react-native-web's Alert.alert is a no-op.
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${SIGN_OUT_TITLE}\n\n${SIGN_OUT_BODY}`) ?? true) void signOutNow();
      return;
    }
    Alert.alert(SIGN_OUT_TITLE, SIGN_OUT_BODY, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOutNow() },
    ]);
  }, [signOutNow]);

  return { busy, signOutNow, confirmSignOut };
}
