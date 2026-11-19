import { router, type Href } from 'expo-router';

let pending: Href | null = null;

/** Sends a guest to sign in and brings them back to `returnTo` afterwards. */
export function signInThenReturn(returnTo: Href) {
  pending = returnTo;
  router.push('/auth');
}

/** After a successful sign-in: back to the screen that asked for it, else Home. */
export function leaveAuthAfterSignIn() {
  const target = pending;
  pending = null;
  if (target) router.dismissTo(target);
  else router.replace('/(tabs)/home');
}
