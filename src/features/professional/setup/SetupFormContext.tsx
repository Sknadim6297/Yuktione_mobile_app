import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  emptySetupValues,
  type ProfessionalSetupDraft,
} from '@/features/professional/setup/schema';

type SetupFormContextValue = {
  values: ProfessionalSetupDraft;
  /** Local UI flag only — not server-verified until /api/v1 OTP exists. */
  emailReadyForSetup: boolean;
  updateValues: (patch: Partial<ProfessionalSetupDraft>) => void;
  setEmailFromOtpFlow: (email: string) => void;
  reset: () => void;
};

const SetupFormContext = createContext<SetupFormContextValue | null>(null);

export function SetupFormProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<ProfessionalSetupDraft>(emptySetupValues);
  const [emailReadyForSetup, setEmailReadyForSetup] = useState(false);

  const updateValues = useCallback((patch: Partial<ProfessionalSetupDraft>) => {
    setValues((current) => ({ ...current, ...patch }));
  }, []);

  const setEmailFromOtpFlow = useCallback((email: string) => {
    setValues((current) => ({ ...current, email }));
    setEmailReadyForSetup(true);
  }, []);

  const reset = useCallback(() => {
    setValues(emptySetupValues);
    setEmailReadyForSetup(false);
  }, []);

  const value = useMemo(
    () => ({
      values,
      emailReadyForSetup,
      updateValues,
      setEmailFromOtpFlow,
      reset,
    }),
    [values, emailReadyForSetup, updateValues, setEmailFromOtpFlow, reset],
  );

  return <SetupFormContext.Provider value={value}>{children}</SetupFormContext.Provider>;
}

export function useSetupForm() {
  const context = useContext(SetupFormContext);
  if (!context) {
    throw new Error('useSetupForm must be used within SetupFormProvider');
  }
  return context;
}
