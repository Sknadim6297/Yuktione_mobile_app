import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { BrandBackground, BrandLogo } from '@/components/brand';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { customerHydrated, getCustomerState } from '@/features/customer/store';
import { SplashScreen } from '@/features/splash/SplashScreen';

/** Longest we wait for the saved-session check before showing the normal flow. */
const SESSION_CHECK_MS = 7000;

/**
 * Screen 01 — YuktiOne Splash.
 * A customer who already signed in (valid saved token) goes straight to Home.
 * Everyone else sees Splash → Onboarding → Sign in as before.
 */
export default function SplashRoute() {
  const [checked, setChecked] = useState(FRONTEND_ONLY);

  useEffect(() => {
    if (FRONTEND_ONLY) return;
    let active = true;
    const timer = setTimeout(() => active && setChecked(true), SESSION_CHECK_MS);
    void customerHydrated.finally(() => {
      clearTimeout(timer);
      if (active) setChecked(true);
    });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!checked) {
    // Brand-only frame while the saved token is verified (no login flash, no blank screen).
    return (
      <BrandBackground variant="soft" style={styles.checking}>
        <BrandLogo width={210} />
      </BrandBackground>
    );
  }

  if (!FRONTEND_ONLY && getCustomerState().session?.source === 'api') {
    return <Redirect href="/(tabs)/home" />;
  }

  return <SplashScreen />;
}

const styles = StyleSheet.create({
  checking: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
