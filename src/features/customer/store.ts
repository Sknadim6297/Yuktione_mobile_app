import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import {
  addDays,
  moodById,
  PROGRAMMES,
  toIsoDate,
  type MoodId,
  type SessionTypeId,
} from '@/features/customer/content';
import type { PaymentAttempt } from '@/features/customer/payments';
import { fetchCurrentUser } from '@/services/api/auth';
import { clearAuthToken, getAuthToken } from '@/services/api/tokenStorage';

const STORAGE_KEY = 'yukti.customer.state.v1';

export type Session = {
  name: string;
  email: string;
  /** preview = tour seed; typed = local UI; api = Sanctum-backed. */
  source: 'preview' | 'typed' | 'api';
  userId?: number;
  phone?: string | null;
};

export type Booking = {
  id: string;
  expertId: string;
  sessionType: SessionTypeId;
  date: string;
  time: string;
  note: string;
  fee: number;
  status: 'upcoming' | 'past' | 'cancelled';
  payment: PaymentAttempt['state'] | 'unpaid';
  paymentMessage: string;
  sample?: boolean;
};

export type Enrollment = {
  programmeId: string;
  completedDays: number[];
  /** Device preview. Payment is not collected in this build. */
  payment: 'not_collected';
};

export type Goal = {
  id: string;
  title: string;
  done: number;
  total: number;
  icon: 'locate-outline' | 'flower-outline' | 'heart-outline';
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  at: string;
};

export type JournalEntry = {
  id: string;
  toolId: string;
  text: string;
  at: string;
};

export type MoodPoint = {
  date: string;
  mood: MoodId;
  score: number;
};

export type CustomerState = {
  ready: boolean;
  session: Session | null;
  /** Account whose device-only data this is; kept after the session ends so another sign-in can't inherit it. */
  ownerUserId?: number | null;
  moodHistory: MoodPoint[];
  bookings: Booking[];
  enrollments: Enrollment[];
  goals: Goal[];
  activities: Activity[];
  journal: JournalEntry[];
  savedToolIds: string[];
  favouriteExpertIds: string[];
  savedProgrammeIds: string[];
  waterDate: string;
  waterCups: number;
};

function previewMoodHistory(): MoodPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scores: { mood: MoodId; score: number }[] = [
    { mood: 'okay', score: 6 },
    { mood: 'calm', score: 7 },
    { mood: 'low', score: 5 },
    { mood: 'okay', score: 6 },
    { mood: 'calm', score: 7.5 },
    { mood: 'okay', score: 6.5 },
    { mood: 'calm', score: 8 },
  ];
  return scores.map((point, index) => ({
    date: toIsoDate(addDays(today, index - 6)),
    mood: point.mood,
    score: point.score,
  }));
}

function previewBookings(): Booking[] {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const later = addDays(today, 4);
  return [
    {
      id: 'sample-ananya',
      expertId: 'ananya',
      sessionType: 'video',
      date: toIsoDate(tomorrow),
      time: '10:00 AM',
      note: '',
      fee: 799,
      status: 'upcoming',
      payment: 'unpaid',
      paymentMessage: 'Sample schedule. No payment has been taken.',
      sample: true,
    },
    {
      id: 'sample-rahul',
      expertId: 'rahul',
      sessionType: 'video',
      date: toIsoDate(later),
      time: '4:00 PM',
      note: '',
      fee: 799,
      status: 'upcoming',
      payment: 'unpaid',
      paymentMessage: 'Sample schedule. No payment has been taken.',
      sample: true,
    },
  ];
}

function previewState(): CustomerState {
  return {
    ready: true,
    session: {
      name: '',
      email: '',
      source: 'preview',
    },
    moodHistory: previewMoodHistory(),
    bookings: previewBookings(),
    enrollments: [
      {
        programmeId: 'stress-relief-7',
        completedDays: [1, 2, 3],
        payment: 'not_collected',
      },
    ],
    goals: [
      { id: 'stress', title: 'Feel Less Stressed', done: 3, total: 7, icon: 'locate-outline' },
      {
        id: 'mindful',
        title: 'Build a Daily Mindfulness Habit',
        done: 5,
        total: 7,
        icon: 'flower-outline',
      },
    ],
    activities: [
      { id: 'a1', title: 'Mood Check-in', detail: 'You felt Calm today.', at: 'Today, 9:30 AM' },
      { id: 'a2', title: 'Gratitude Journal', detail: "Added 3 things you're grateful for.", at: 'Yesterday, 10:15 PM' },
      { id: 'a3', title: 'Programme Progress', detail: '7-Day Stress Relief — Day 3 completed.', at: 'Yesterday, 8:00 PM' },
    ],
    journal: [],
    savedToolIds: ['mood-check-in', 'journal', 'gratitude'],
    favouriteExpertIds: [],
    savedProgrammeIds: ['stress-relief-7'],
    waterDate: toIsoDate(new Date()),
    waterCups: 3,
  };
}

function emptyState(): CustomerState {
  return {
    ready: true,
    session: null,
    moodHistory: [],
    bookings: [],
    enrollments: [],
    goals: [],
    activities: [],
    journal: [],
    savedToolIds: [],
    favouriteExpertIds: [],
    savedProgrammeIds: [],
    waterDate: toIsoDate(new Date()),
    waterCups: 0,
  };
}

let memorySnapshot: string | null = null;
let state: CustomerState = FRONTEND_ONLY ? previewState() : emptyState();
let mutated = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
  void persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function persist(): Promise<void> {
  const snapshot = JSON.stringify({ ...state, ready: true });
  if (Platform.OS === 'web') {
    memorySnapshot = snapshot;
    return;
  }
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, snapshot);
  } catch {
    // SecureStore can reject oversized values. Memory state still works.
  }
}

function deviceOwner(value: CustomerState): number | null {
  return value.ownerUserId ?? value.session?.userId ?? null;
}

function isState(value: unknown): value is CustomerState {
  return Boolean(value) && typeof value === 'object' && value !== null && 'bookings' in value;
}

export async function hydrateCustomerState(): Promise<void> {
  try {
    const raw =
      Platform.OS === 'web'
        ? memorySnapshot
        : await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw && !mutated) {
      const parsed: unknown = JSON.parse(raw);
      // A snapshot saved while the UI tour was on holds demo bookings, moods and
      // programmes; never show that seed to a real customer.
      const isPreviewSeed = isState(parsed) && parsed.session?.source === 'preview';
      if (isState(parsed) && !(isPreviewSeed && !FRONTEND_ONLY)) {
        state = { ...parsed, ready: true };
      }
    }
  } catch {
    // Keep the in-memory seed.
  }

  if (!FRONTEND_ONLY) {
    try {
      const token = await getAuthToken();
      if (token) {
        const me = await fetchCurrentUser();
        if (me.ok) {
          const base = deviceOwner(state) === me.user.id ? state : emptyState();
          state = {
            ...base,
            ownerUserId: me.user.id,
            ready: true,
            session: {
              userId: me.user.id,
              name: me.user.name,
              email: me.user.email,
              phone: me.user.phone,
              source: 'api',
            },
          };
          emitQuiet();
          void persist();
          return;
        }
        if (me.status === 401) {
          await clearAuthToken();
          state = { ...state, session: null, ready: true };
          emitQuiet();
          void persist();
          return;
        }
      } else if (state.session?.source === 'api') {
        state = { ...state, session: null };
      }
    } catch {
      // Network failure: keep cached local session if present.
    }
  }

  state = { ...state, ready: true };
  emitQuiet();
}

function emitQuiet(): void {
  listeners.forEach((listener) => listener());
}

function update(recipe: (current: CustomerState) => CustomerState): void {
  mutated = true;
  state = recipe(state);
  emit();
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'there';
  const word = local.split(/[.\-_]/)[0] ?? local;
  if (!word) return 'there';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function pushActivity(current: CustomerState, title: string, detail: string): Activity[] {
  return [
    {
      id: `act-${Date.now()}`,
      title,
      detail,
      at: 'Just now',
    },
    ...current.activities,
  ].slice(0, 12);
}

export const customerActions = {
  signIn(email: string, name?: string): void {
    update((current) => ({
      ...current,
      session: {
        email,
        name: name?.trim() || nameFromEmail(email),
        source: 'typed',
      },
    }));
  },
  signInFromApi(user: {
    id: number;
    email: string;
    name: string;
    phone?: string | null;
  }): void {
    update((current) => ({
      ...(deviceOwner(current) === user.id ? current : emptyState()),
      ownerUserId: user.id,
      session: {
        userId: user.id,
        email: user.email,
        name: user.name?.trim() || nameFromEmail(user.email),
        phone: user.phone,
        source: 'api',
      },
    }));
  },
  /** Clears the session and everything saved for this person on the device. */
  signOut(): void {
    update(() => emptyState());
  },
  /** Removes moods, saved items, journal, goals and bookings stored on this device; keeps the session. */
  clearDeviceData(): void {
    update((current) => ({ ...emptyState(), session: current.session }));
  },
  setMood(mood: MoodId): void {
    const today = toIsoDate(new Date());
    const option = moodById(mood);
    update((current) => {
      const history = current.moodHistory.filter((point) => point.date !== today);
      history.push({ date: today, mood, score: option.score });
      return {
        ...current,
        moodHistory: history.sort((a, b) => a.date.localeCompare(b.date)),
        activities: pushActivity(current, 'Mood Check-in', `You felt ${option.label} today.`),
      };
    });
  },
  toggleSavedTool(id: string): void {
    update((current) => ({
      ...current,
      savedToolIds: current.savedToolIds.includes(id)
        ? current.savedToolIds.filter((item) => item !== id)
        : [...current.savedToolIds, id],
    }));
  },
  toggleFavouriteExpert(id: string): void {
    update((current) => ({
      ...current,
      favouriteExpertIds: current.favouriteExpertIds.includes(id)
        ? current.favouriteExpertIds.filter((item) => item !== id)
        : [...current.favouriteExpertIds, id],
    }));
  },
  toggleSavedProgramme(id: string): void {
    update((current) => ({
      ...current,
      savedProgrammeIds: current.savedProgrammeIds.includes(id)
        ? current.savedProgrammeIds.filter((item) => item !== id)
        : [...current.savedProgrammeIds, id],
    }));
  },
  addJournal(toolId: string, text: string): void {
    update((current) => ({
      ...current,
      journal: [
        { id: `note-${Date.now()}`, toolId, text, at: new Date().toISOString() },
        ...current.journal,
      ],
      activities: pushActivity(current, 'Journal', 'A reflection was saved on this device.'),
    }));
  },
  setWaterCups(cups: number): void {
    update((current) => ({
      ...current,
      waterDate: toIsoDate(new Date()),
      waterCups: Math.max(0, Math.min(8, cups)),
    }));
  },
  bumpGoal(id: string): void {
    update((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === id ? { ...goal, done: Math.min(goal.total, goal.done + 1) } : goal,
      ),
    }));
  },
  addGoal(title: string): void {
    update((current) => ({
      ...current,
      goals: [
        ...current.goals,
        { id: `goal-${Date.now()}`, title, done: 0, total: 7, icon: 'heart-outline' },
      ],
    }));
  },
  createBooking(input: Omit<Booking, 'id' | 'status' | 'payment' | 'paymentMessage' | 'sample'>): Booking {
    const booking: Booking = {
      ...input,
      id: `YK-${Date.now()}`,
      status: 'upcoming',
      payment: 'unpaid',
      paymentMessage: 'Payment has not been taken.',
    };
    update((current) => ({
      ...current,
      bookings: [booking, ...current.bookings],
      activities: pushActivity(current, 'Booking request', 'A session was saved. Payment is still due.'),
    }));
    return booking;
  },
  setBookingPayment(id: string, attempt: PaymentAttempt): void {
    update((current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              payment: attempt.state,
              paymentMessage: attempt.message,
              sample: false,
            }
          : booking,
      ),
    }));
  },
  cancelBooking(id: string): void {
    update((current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === id ? { ...booking, status: 'cancelled' } : booking,
      ),
    }));
  },
  enroll(programmeId: string): void {
    update((current) => {
      if (current.enrollments.some((item) => item.programmeId === programmeId)) {
        return current;
      }
      const programme = PROGRAMMES.find((item) => item.id === programmeId);
      return {
        ...current,
        enrollments: [
          ...current.enrollments,
          { programmeId, completedDays: [], payment: 'not_collected' },
        ],
        activities: pushActivity(
          current,
          'Programme',
          `${programme?.title ?? 'Programme'} was saved on this device. Payment was not collected.`,
        ),
      };
    });
  },
  completeDay(programmeId: string, day: number): void {
    update((current) => ({
      ...current,
      enrollments: current.enrollments.map((enrollment) => {
        if (enrollment.programmeId !== programmeId) return enrollment;
        const completedDays = enrollment.completedDays.includes(day)
          ? enrollment.completedDays
          : [...enrollment.completedDays, day].sort((a, b) => a - b);
        return { ...enrollment, completedDays };
      }),
      activities: pushActivity(current, 'Programme Progress', `Day ${day} marked complete on this device.`),
    }));
  },
};

export function getCustomerState(): CustomerState {
  return state;
}

export function useCustomerState(): CustomerState {
  return useSyncExternalStore(subscribe, getCustomerState, getCustomerState);
}

export function latestBooking(): Booking | undefined {
  return getCustomerState().bookings.find((booking) => booking.status !== 'cancelled');
}

void hydrateCustomerState();
