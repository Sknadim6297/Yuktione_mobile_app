import { router, type Href } from 'expo-router';

let pending: Href | null = null;

/** Sends a guest to sign in and brings them back to `returnTo` afterwards. */
export function signInThenReturn(returnTo: Href) {
  pending = returnTo;
  router.push('/auth');
}

/** True while a screen is waiting for this sign-in to finish (so Back leads somewhere useful). */
export function wantsReturn(): boolean {
  return pending !== null && router.canGoBack();
}

/** After a successful sign-in or sign-up: back to the screen that asked for it, else Home. */
export function leaveAuthAfterSignIn() {
  const target = pending;
  pending = null;
  if (target) router.dismissTo(target);
  else router.replace('/(tabs)/home');
}

/** "Continue as guest": drop any pending return and leave the auth screens. */
export function skipSignIn() {
  const hadReturn = pending !== null;
  pending = null;
  if (hadReturn && router.canGoBack()) router.back();
  else router.replace('/(tabs)/home');
}
