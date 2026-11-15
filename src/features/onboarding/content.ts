export const ONBOARDING_STEPS = [
  {
    id: 'step-1',
    route: '/onboarding/step-1' as const,
    heading: 'Real guidance\nfor real life',
    description:
      'Trusted experts, practical tools and personalised support — all in one place.',
    illustration: require('../../../assets/illustrations/onboarding-01.jpg'),
    illustrationLabel:
      'Woman looking toward a sunrise over calm water with eucalyptus and lavender',
  },
  {
    id: 'step-2',
    route: '/onboarding/step-2' as const,
    heading: 'Small steps.\nBig progress.',
    description: 'Reflect, learn and take action with expert support.',
    illustration: require('../../../assets/illustrations/onboarding-02.jpg'),
    illustrationLabel:
      'Pastel mountains, lake and sunrise framed by eucalyptus leaves and lavender flowers',
  },
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

/** Screen 04 — Login / Sign Up entry. */
export const AUTH_ENTRY_ROUTE = '/auth' as const;
