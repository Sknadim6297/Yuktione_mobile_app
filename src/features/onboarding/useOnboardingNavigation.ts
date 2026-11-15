import { router } from 'expo-router';
import { useCallback, useRef } from 'react';

import { AUTH_ENTRY_ROUTE } from '@/features/onboarding/content';
import { setOnboardingComplete } from '@/features/onboarding/storage';

/**
 * Shared onboarding navigation helpers — prevents double taps / route loops.
 */
export function useOnboardingNavigation() {
  const navigatingRef = useRef(false);

  const finishOnboarding = useCallback(async () => {
    if (navigatingRef.current) {
      return;
    }
    navigatingRef.current = true;
    try {
      await setOnboardingComplete();
      router.replace(AUTH_ENTRY_ROUTE);
    } finally {
      navigatingRef.current = false;
    }
  }, []);

  const goToStep = useCallback((href: '/onboarding/step-1' | '/onboarding/step-2' | '/onboarding/step-3') => {
    if (navigatingRef.current) {
      return;
    }
    navigatingRef.current = true;
    router.push(href);
    requestAnimationFrame(() => {
      navigatingRef.current = false;
    });
  }, []);

  const goBack = useCallback(() => {
    if (navigatingRef.current) {
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/step-1');
  }, []);

  return { finishOnboarding, goToStep, goBack };
}
