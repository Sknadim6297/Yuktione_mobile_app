import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { HeaderAvatar } from '@/features/customer/home/HomeSections';
import { expertInitials } from '@/features/customer/liveCatalog';
import { useAccountScope, useMyNotifications } from '@/features/customer/myspace/accountData';
import { profileImageUrl, useProfileQuery } from '@/features/customer/myspace/parts';
import { NotificationBell } from '@/features/customer/myspace/SpaceDesign';
import { useCustomerState } from '@/features/customer/store';
import { resolveImageUrl } from '@/services/media/imageUrl';

/** Same header actions as Home: real unread count and the signed-in avatar. */
export function DiscoverHeaderActions() {
  const session = useCustomerState().session;
  const account = useAccountScope();
  const profile = useProfileQuery(account.enabled);
  const notifications = useMyNotifications(3);
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      if (!account.enabled) return;
      void queryClient.refetchQueries({
        queryKey: ['v1', 'my', account.userId, 'notifications'],
        stale: true,
        type: 'active',
      });
    }, [queryClient, account.enabled, account.userId]),
  );

  const name = profile.data?.name ?? session?.name ?? '';
  const signedIn = account.enabled && Boolean(name.trim());
  const unread = account.enabled ? (notifications.data?.pages[0]?.unread_count ?? 0) : 0;

  return (
    <>
      <NotificationBell unread={unread} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={signedIn ? 'Open My Space' : 'Sign in or open My Space'}
        onPress={() => router.push('/(tabs)/my-space')}
        hitSlop={6}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
      >
        <HeaderAvatar
          uri={signedIn ? resolveImageUrl(profileImageUrl(profile.data)) : null}
          initials={signedIn ? expertInitials(name) : null}
        />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  avatarButton: { borderRadius: 20 },
  pressed: { opacity: 0.8 },
});
