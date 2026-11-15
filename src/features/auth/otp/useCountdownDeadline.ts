import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

function remainingMs(deadlineMs: number | null, nowMs: number): number {
  if (deadlineMs === null) {
    return 0;
  }
  return Math.max(0, deadlineMs - nowMs);
}

export function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Deadline-based countdown (survives backgrounding better than tick-only counters).
 * Only pass a deadline after a real OTP send response confirms cooldown timing.
 */
export function useCountdownDeadline(deadlineIso: string | null | undefined) {
  const deadlineMs = useMemo(() => {
    if (!deadlineIso) {
      return null;
    }
    const parsed = Date.parse(deadlineIso);
    return Number.isNaN(parsed) ? null : parsed;
  }, [deadlineIso]);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (deadlineMs === null) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        setNowMs(Date.now());
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      sub.remove();
    };
  }, [deadlineMs]);

  const remainingComputed = remainingMs(deadlineMs, nowMs);
  const totalSeconds = Math.ceil(remainingComputed / 1000);

  return {
    remainingMs: remainingComputed,
    totalSeconds,
    formatted: formatMmSs(totalSeconds),
    isRunning: remainingComputed > 0,
  };
}
