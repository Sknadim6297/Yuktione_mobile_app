import { Redirect } from 'expo-router';

/** Entry redirects into Screen 02 — Onboarding 1. */
export default function OnboardingIndex() {
  return <Redirect href="/onboarding/step-1" />;
}
