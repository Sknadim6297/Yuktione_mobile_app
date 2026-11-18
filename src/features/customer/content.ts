import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

import { BRAND_ASSETS, CATEGORY_IMAGES, PROGRAMME_IMAGES } from '@/constants/brandAssets';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Reference catalog for the customer screens.
 * This is designed product copy, not a live API response.
 * Personal bookings, payments, and progress are stored separately.
 */
export const art = {
  lake: PROGRAMME_IMAGES.habits,
  dawn: PROGRAMME_IMAGES.calm,
  splash: BRAND_ASSETS.heroPoster,
  hills: PROGRAMME_IMAGES.career,
  leaves: CATEGORY_IMAGES.lifestyle,
  lotus: CATEGORY_IMAGES.lotus,
} satisfies Record<string, ImageSourcePropType>;

export type MoodId = 'happy' | 'calm' | 'okay' | 'low' | 'stressed';

export type MoodOption = {
  id: MoodId;
  label: string;
  emoji: string;
  score: number;
  tint: string;
  ink: string;
  meaning: string;
};

export const MOODS: MoodOption[] = [
  {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    score: 9,
    tint: '#F7EBDD',
    ink: '#B87333',
    meaning: 'You seem bright and open today. Keep sharing that energy in small, kind ways.',
  },
  {
    id: 'calm',
    label: 'Calm',
    emoji: '🍃',
    score: 8,
    tint: '#F8EAF1',
    ink: '#8A0F4D',
    meaning:
      "You're feeling calm, focused and emotionally balanced. Your mindset is positive, which can help you stay productive and resilient.",
  },
  {
    id: 'okay',
    label: 'Okay',
    emoji: '😐',
    score: 6,
    tint: '#F7EBDD',
    ink: '#B87333',
    meaning: 'You are steady, not stuck. A short pause or a kind check-in can lift the rest of the day.',
  },
  {
    id: 'low',
    label: 'Low',
    emoji: '☁️',
    score: 4,
    tint: '#F6EEF9',
    ink: '#7B3F96',
    meaning: 'Energy is low today. Keep the plan small: water, a short walk, and one gentle task.',
  },
  {
    id: 'stressed',
    label: 'Stressed',
    emoji: '⚡',
    score: 3,
    tint: '#FCE8F1',
    ink: '#C3196B',
    meaning: 'Stress is asking for a slower pace. A few longer exhales can bring the body back first.',
  },
];

export function moodById(id: MoodId): MoodOption {
  return MOODS.find((mood) => mood.id === id) ?? MOODS[1]!;
}

export type ToolGroup = 'daily' | 'mind' | 'health';
export type ToolFilter = 'all' | 'wellbeing' | 'career' | 'health' | 'lifestyle';

export type CatalogTool = {
  id: string;
  name: string;
  blurb: string;
  group: ToolGroup;
  filters: ToolFilter[];
  price: 'free' | 'paid';
  icon: IconName;
  tint: string;
  ink: string;
  runner: 'mood' | 'journal' | 'gratitude' | 'goals' | 'habits' | 'breathe' | 'bmi' | 'water' | 'tips' | 'note';
};

export const TOOLS: CatalogTool[] = [
  { id: 'mood-check-in', name: 'Mood Check-in', blurb: 'Track your mood daily', group: 'daily', filters: ['wellbeing'], price: 'free', icon: 'leaf-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'mood' },
  { id: 'journal', name: 'Journal', blurb: 'Write, reflect and grow', group: 'daily', filters: ['wellbeing'], price: 'free', icon: 'book-outline', tint: '#F6EEF9', ink: '#7B3F96', runner: 'journal' },
  { id: 'gratitude', name: 'Gratitude', blurb: 'Build a positive mindset', group: 'daily', filters: ['wellbeing', 'lifestyle'], price: 'free', icon: 'heart-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'gratitude' },
  { id: 'goal-tracker', name: 'Goal Tracker', blurb: 'Set and track your goals', group: 'daily', filters: ['career', 'lifestyle'], price: 'free', icon: 'flag-outline', tint: '#F6EEF9', ink: '#7B3F96', runner: 'goals' },
  { id: 'habit-builder', name: 'Habit Builder', blurb: 'Build better daily habits', group: 'daily', filters: ['lifestyle'], price: 'paid', icon: 'calendar-outline', tint: '#FFF1F6', ink: '#C3196B', runner: 'habits' },
  { id: 'meditation', name: 'Meditation', blurb: 'Guided sessions for calm & focus', group: 'mind', filters: ['wellbeing'], price: 'free', icon: 'body-outline', tint: '#F6EEF9', ink: '#7B3F96', runner: 'breathe' },
  { id: 'breathing', name: 'Breathing Exercises', blurb: 'Relax, reset and feel balanced', group: 'mind', filters: ['wellbeing', 'health'], price: 'free', icon: 'fitness-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'breathe' },
  { id: 'stress-relief', name: 'Stress Relief', blurb: 'Tools to manage stress effectively', group: 'mind', filters: ['wellbeing'], price: 'free', icon: 'cloud-outline', tint: '#F6EEF9', ink: '#7B3F96', runner: 'breathe' },
  { id: 'better-sleep', name: 'Better Sleep', blurb: 'Improve your sleep quality', group: 'mind', filters: ['health', 'lifestyle'], price: 'free', icon: 'moon-outline', tint: '#F6EEF9', ink: '#7B3F96', runner: 'tips' },
  { id: 'anxiety-support', name: 'Anxiety Support', blurb: 'Soothe anxiety with simple tools', group: 'mind', filters: ['wellbeing'], price: 'paid', icon: 'flash-outline', tint: '#FCE8F1', ink: '#C3196B', runner: 'note' },
  { id: 'fitness', name: 'Fitness Tracker', blurb: 'Track activity, steps & calories', group: 'health', filters: ['health'], price: 'free', icon: 'walk-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'note' },
  { id: 'nutrition', name: 'Nutrition Guide', blurb: 'Eat better with simple plans', group: 'health', filters: ['health', 'lifestyle'], price: 'free', icon: 'nutrition-outline', tint: '#FCE8F1', ink: '#C3196B', runner: 'tips' },
  { id: 'bmi', name: 'BMI Calculator', blurb: 'Check your BMI in seconds', group: 'health', filters: ['health'], price: 'free', icon: 'calculator-outline', tint: '#FFF1F6', ink: '#C3196B', runner: 'bmi' },
  { id: 'water', name: 'Water Reminder', blurb: 'Stay hydrated and healthy', group: 'health', filters: ['health', 'lifestyle'], price: 'free', icon: 'water-outline', tint: '#FFF1F6', ink: '#C3196B', runner: 'water' },
  { id: 'wellness-tips', name: 'Wellness Tips', blurb: 'Daily tips for a healthier you', group: 'health', filters: ['lifestyle', 'wellbeing'], price: 'free', icon: 'flower-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'tips' },
  { id: 'career-clarity', name: 'Career Clarity', blurb: 'Explore your interests, strengths and next steps.', group: 'daily', filters: ['career'], price: 'free', icon: 'locate-outline', tint: '#F7EBDD', ink: '#B87333', runner: 'note' },
  { id: 'skills-tracker', name: 'Skills Tracker', blurb: 'Track, build and grow your key skills.', group: 'daily', filters: ['career'], price: 'free', icon: 'trending-up-outline', tint: '#FFF1F6', ink: '#C3196B', runner: 'goals' },
  { id: 'weight-tracker', name: 'Weight Tracker', blurb: 'Log your weight, track trends and stay motivated.', group: 'health', filters: ['health'], price: 'free', icon: 'speedometer-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'note' },
  { id: 'tarot', name: 'Tarot Reflection', blurb: 'Gain clarity and guidance with tarot insights.', group: 'mind', filters: ['lifestyle'], price: 'free', icon: 'sparkles-outline', tint: '#F6EEF9', ink: '#7B3F96', runner: 'tips' },
  { id: 'personal-growth', name: 'Personal Growth', blurb: 'Build better habits, focus and a happier life.', group: 'daily', filters: ['lifestyle', 'career'], price: 'free', icon: 'leaf-outline', tint: '#F8EAF1', ink: '#8A0F4D', runner: 'journal' },
];

export const TOOL_GROUPS: { id: ToolGroup; title: string; icon: IconName }[] = [
  { id: 'daily', title: 'Daily Wellness', icon: 'sunny-outline' },
  { id: 'mind', title: 'Mind & Emotion', icon: 'flower-outline' },
  { id: 'health', title: 'Health & Lifestyle', icon: 'fitness-outline' },
];

export const TOOL_FILTERS: { id: ToolFilter; label: string; icon?: IconName }[] = [
  { id: 'all', label: 'All' },
  { id: 'wellbeing', label: 'Wellbeing', icon: 'flower-outline' },
  { id: 'career', label: 'Career', icon: 'briefcase-outline' },
  { id: 'health', label: 'Health', icon: 'heart-outline' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline' },
];

export function toolById(id: string): CatalogTool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

export type ExploreCategory = {
  slug: string;
  title: string;
  subtitle: string;
  icon: IconName;
  tint: string;
  ink: string;
  summary: string;
  toolCount: number;
  programmeCount: number;
  expertCount: number;
};

export const CATEGORIES: ExploreCategory[] = [
  { slug: 'mental-wellbeing', title: 'Mental Wellbeing', subtitle: 'A calmer, stronger you', icon: 'flower-outline', tint: '#F6EEF9', ink: '#7B3F96', summary: 'Tools, practices and expert support for a calmer, stronger you.', toolCount: 12, programmeCount: 4, expertCount: 18 },
  { slug: 'career', title: 'Career', subtitle: 'Clarity for your next step', icon: 'briefcase-outline', tint: '#FFF1F6', ink: '#C3196B', summary: 'Coaching, planning tools and programmes for work you can feel good about.', toolCount: 8, programmeCount: 3, expertCount: 11 },
  { slug: 'health-fitness', title: 'Health & Fitness', subtitle: 'Energy for everyday life', icon: 'fitness-outline', tint: '#F8EAF1', ink: '#8A0F4D', summary: 'Movement, nutrition and recovery support that stays practical.', toolCount: 9, programmeCount: 3, expertCount: 9 },
  { slug: 'stress-anxiety', title: 'Stress & Anxiety', subtitle: 'Room to breathe again', icon: 'body-outline', tint: '#F7EBDD', ink: '#B87333', summary: 'Short practices and specialists for stress, worry and overload.', toolCount: 7, programmeCount: 2, expertCount: 10 },
  { slug: 'better-sleep', title: 'Better Sleep', subtitle: 'Nights that restore you', icon: 'moon-outline', tint: '#F6EEF9', ink: '#7B3F96', summary: 'Wind-down tools and guidance for deeper, steadier sleep.', toolCount: 5, programmeCount: 2, expertCount: 6 },
  { slug: 'lifestyle-habits', title: 'Lifestyle & Habits', subtitle: 'Small changes that last', icon: 'leaf-outline', tint: '#FFF1F6', ink: '#C3196B', summary: 'Habit, nutrition and routine support for daily life.', toolCount: 8, programmeCount: 3, expertCount: 7 },
];

export function categoryBySlug(slug: string): ExploreCategory | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

export type SessionTypeId = 'video' | 'audio' | 'chat';

export type SessionType = {
  id: SessionTypeId;
  title: string;
  detail: string;
  price: number;
  icon: IconName;
};

export const SESSION_TYPES: SessionType[] = [
  { id: 'video', title: 'Video Session', detail: 'Face-to-face online consultation', price: 799, icon: 'videocam-outline' },
  { id: 'audio', title: 'Audio Session', detail: 'Talk privately over a call', price: 599, icon: 'call-outline' },
  { id: 'chat', title: 'Chat Session', detail: 'Quick guidance via chat', price: 499, icon: 'chatbubbles-outline' },
];

export type Expert = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: string;
  initials: string;
  tint: string;
  about: string;
  areas: { label: string; icon: IconName; tint: string; ink: string }[];
  verified: boolean;
  licensed: boolean;
};

export const EXPERTS: Expert[] = [
  {
    id: 'ananya',
    name: 'Dr. Ananya Sen',
    title: 'Clinical Psychologist',
    specialty: 'Mental Health',
    rating: 4.9,
    reviews: 320,
    experience: '8+ years exp.',
    initials: 'AS',
    tint: '#F8EAF1',
    about:
      "I'm a clinical psychologist with 8+ years of experience, helping individuals manage stress, anxiety, relationships and build emotional resilience for a healthier, happier life.",
    areas: [
      { label: 'Anxiety & Stress', icon: 'flower-outline', tint: '#F6EEF9', ink: '#7B3F96' },
      { label: 'Mood & Emotions', icon: 'happy-outline', tint: '#F7EBDD', ink: '#B87333' },
      { label: 'Relationships', icon: 'people-outline', tint: '#F7EBDD', ink: '#B87333' },
      { label: 'Self-Esteem & Confidence', icon: 'ribbon-outline', tint: '#FFF1F6', ink: '#C3196B' },
      { label: 'Lifestyle Balance', icon: 'leaf-outline', tint: '#F8EAF1', ink: '#8A0F4D' },
    ],
    verified: true,
    licensed: true,
  },
  {
    id: 'rahul',
    name: 'Rahul Mehra',
    title: 'Career Coach',
    specialty: 'Career',
    rating: 4.8,
    reviews: 214,
    experience: '6+ years exp.',
    initials: 'RM',
    tint: '#FFF1F6',
    about:
      'I help professionals find clarity, choose a direction, and take the next practical step in their career without burning out.',
    areas: [
      { label: 'Career Clarity', icon: 'briefcase-outline', tint: '#FFF1F6', ink: '#C3196B' },
      { label: 'Confidence', icon: 'ribbon-outline', tint: '#F6EEF9', ink: '#7B3F96' },
    ],
    verified: true,
    licensed: false,
  },
  {
    id: 'priya',
    name: 'Dr. Priya Sharma',
    title: 'Nutrition & Wellness Expert',
    specialty: 'Health & Fitness',
    rating: 4.9,
    reviews: 189,
    experience: '7+ years exp.',
    initials: 'PS',
    tint: '#F8EAF1',
    about:
      'I work with people who want steadier energy, better food habits and a routine that fits real life.',
    areas: [
      { label: 'Nutrition', icon: 'nutrition-outline', tint: '#F8EAF1', ink: '#8A0F4D' },
      { label: 'Habits', icon: 'calendar-outline', tint: '#FFF1F6', ink: '#C3196B' },
    ],
    verified: true,
    licensed: true,
  },
];

export function expertById(id: string): Expert | undefined {
  return EXPERTS.find((expert) => expert.id === id);
}

export const EXPERT_SPECIALTIES = [
  'Mental Health',
  'Career',
  'Nutrition & Fitness',
  'Lifestyle & Habits',
  'Spirituality & Mindfulness',
] as const;

export const REVIEWS = [
  {
    id: 'pooja',
    expertId: 'ananya',
    name: 'Pooja M.',
    when: '2 weeks ago',
    stars: 5,
    text: 'Dr. Ananya is very empathetic and supportive. Her sessions helped me manage my anxiety and feel much more in control.',
  },
  {
    id: 'arjun',
    expertId: 'ananya',
    name: 'Arjun K.',
    when: '1 month ago',
    stars: 5,
    text: 'Clear, practical guidance. I left with a plan I could actually follow during a stressful week.',
  },
];

export type ProgrammeLevel = 'Beginner' | 'Intermediate';

export type ProgrammeDay = {
  day: number;
  title: string;
  summary: string;
  minutes: number;
  format: string;
  icon: IconName;
};

export type Programme = {
  id: string;
  title: string;
  summary: string;
  days: number;
  level: ProgrammeLevel;
  price: number;
  compareAt: number;
  enrolledLabel: string;
  category: 'all' | 'mindfulness' | 'career' | 'relationships' | 'lifestyle';
  image: ImageSourcePropType;
  outcomes: { label: string; icon: IconName }[];
  plan: ProgrammeDay[];
  includes: string[];
  popular?: boolean;
};

const STRESS_PLAN: ProgrammeDay[] = [
  { day: 1, title: 'Pause & Breathe', summary: 'Start your journey with mindful breathing and quick stress relief.', minutes: 12, format: 'Audio + Guide', icon: 'play-outline' },
  { day: 2, title: 'Release Tension', summary: 'Simple techniques to let go of physical and mental tension.', minutes: 12, format: 'Audio + Practice', icon: 'flower-outline' },
  { day: 3, title: 'Calm Your Mind', summary: 'Quiet the mental noise and feel more centered.', minutes: 14, format: 'Audio + Meditation', icon: 'bulb-outline' },
  { day: 4, title: 'Build Positivity', summary: 'Train your mind to notice and focus on the good.', minutes: 10, format: 'Audio + Reflection', icon: 'heart-outline' },
  { day: 5, title: 'Better Sleep', summary: 'Create a relaxing bedtime routine for deeper sleep.', minutes: 15, format: 'Audio + Routine', icon: 'moon-outline' },
  { day: 6, title: 'Stay Balanced', summary: 'Simple daily habits to manage stress long-term.', minutes: 12, format: 'Audio + Tips', icon: 'leaf-outline' },
  { day: 7, title: 'Reflect & Continue', summary: 'Look back, celebrate your progress and set your next steps.', minutes: 12, format: 'Audio + Planning', icon: 'star-outline' },
];

export const PROGRAMMES: Programme[] = [
  {
    id: 'stress-to-balance',
    title: 'Stress to Balance',
    summary: '4-week programme to reduce stress and build calm.',
    days: 28,
    level: 'Beginner',
    price: 799,
    compareAt: 1099,
    enrolledLabel: '9,800+ Enrolled',
    category: 'mindfulness',
    image: art.dawn,
    popular: true,
    outcomes: [
      { label: 'Reduce Stress', icon: 'flower-outline' },
      { label: 'Build Calm', icon: 'leaf-outline' },
      { label: 'Sleep Better', icon: 'moon-outline' },
      { label: 'Feel Steady', icon: 'heart-outline' },
    ],
    plan: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      title: STRESS_PLAN[index]?.title ?? `Week focus ${index + 1}`,
      summary: STRESS_PLAN[index]?.summary ?? 'A short practice for calmer days.',
      minutes: 12,
      format: 'Audio + Guide',
      icon: STRESS_PLAN[index]?.icon ?? ('leaf-outline' as const),
    })),
    includes: [
      '4 weeks of guided practices',
      'Daily calm and breath exercises',
      'Progress tracker',
      'Lifetime access on this device until programme APIs exist',
    ],
  },
  {
    id: 'stress-relief-7',
    title: '7-Day Stress Relief Challenge',
    summary: 'Reduce stress, build calm and feel more in control — in just 7 days.',
    days: 7,
    level: 'Beginner',
    price: 499,
    compareAt: 799,
    enrolledLabel: '12,430+ Enrolled',
    category: 'mindfulness',
    image: art.splash,
    popular: true,
    outcomes: [
      { label: 'Reduce Stress', icon: 'flower-outline' },
      { label: 'Sleep Better', icon: 'moon-outline' },
      { label: 'Improve Focus', icon: 'locate-outline' },
      { label: 'Feel More Positive', icon: 'leaf-outline' },
    ],
    plan: STRESS_PLAN,
    includes: [
      '7 guided audio/video sessions (10–15 mins each)',
      'Daily practical exercises & mindfulness techniques',
      'A simple, downloadable practice tracker (PDF)',
      'Lifetime access to the programme',
    ],
  },
  {
    id: 'mindfulness-everyday',
    title: 'Mindfulness for Everyday Life',
    summary: 'Build a calmer, more focused and positive mindset.',
    days: 14,
    level: 'Beginner',
    price: 499,
    compareAt: 699,
    enrolledLabel: '8,200+ Enrolled',
    category: 'mindfulness',
    image: art.lake,
    plan: STRESS_PLAN.map((day, index) => ({ ...day, day: index + 1, title: `Day ${index + 1} practice` })),
    outcomes: [
      { label: 'Daily calm', icon: 'flower-outline' },
      { label: 'Clearer focus', icon: 'locate-outline' },
    ],
    includes: ['Daily mindfulness audio', 'Reflection prompts', 'Progress tracker'],
  },
  {
    id: 'career-clarity',
    title: 'Career Clarity Programme',
    summary: 'Gain clarity, set goals and take confident steps in your career.',
    days: 10,
    level: 'Intermediate',
    price: 799,
    compareAt: 999,
    enrolledLabel: '4,110+ Enrolled',
    category: 'career',
    image: art.dawn,
    plan: Array.from({ length: 10 }, (_, index) => ({
      day: index + 1,
      title: index === 0 ? 'Name what matters' : `Career step ${index + 1}`,
      summary: 'A short exercise to clarify direction and the next action.',
      minutes: 12,
      format: 'Guide + Worksheet',
      icon: 'briefcase-outline' as const,
    })),
    outcomes: [
      { label: 'Career clarity', icon: 'briefcase-outline' },
      { label: 'Next step', icon: 'flag-outline' },
    ],
    includes: ['Goal worksheets', 'Daily career prompts', 'Progress tracker'],
  },
  {
    id: 'healthier-relationships',
    title: 'Build Healthier Relationships',
    summary: 'Improve communication, trust and emotional connection.',
    days: 14,
    level: 'Intermediate',
    price: 799,
    compareAt: 1099,
    enrolledLabel: '3,540+ Enrolled',
    category: 'relationships',
    image: art.hills,
    plan: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      title: `Connection day ${index + 1}`,
      summary: 'A short practice for clearer, kinder conversations.',
      minutes: 12,
      format: 'Audio + Reflection',
      icon: 'people-outline' as const,
    })),
    outcomes: [
      { label: 'Better communication', icon: 'chatbubbles-outline' },
      { label: 'More trust', icon: 'heart-outline' },
    ],
    includes: ['Conversation guides', 'Daily reflections', 'Progress tracker'],
  },
  {
    id: 'lifestyle-reset',
    title: 'Holistic Lifestyle Reset',
    summary: 'Small daily habits for better energy, sleep and overall well-being.',
    days: 21,
    level: 'Intermediate',
    price: 999,
    compareAt: 1299,
    enrolledLabel: '2,980+ Enrolled',
    category: 'lifestyle',
    image: art.leaves,
    plan: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      title: `Reset day ${index + 1}`,
      summary: 'One small habit for energy, food, or rest.',
      minutes: 10,
      format: 'Guide + Habit',
      icon: 'leaf-outline' as const,
    })),
    outcomes: [
      { label: 'Steadier energy', icon: 'sunny-outline' },
      { label: 'Better sleep', icon: 'moon-outline' },
    ],
    includes: ['Habit tracker', 'Daily tips', 'Lifetime access'],
  },
];

export function programmeById(id: string): Programme | undefined {
  return PROGRAMMES.find((programme) => programme.id === id);
}

export const TIME_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
] as const;

export const TIPS = [
  'Drink a glass of water before your first coffee.',
  'Step outside for two minutes of daylight.',
  'Name one thing that went well before sleep.',
  'Put the phone away for the first ten minutes after waking.',
  'Eat one meal today without a screen.',
];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function startOfWeek(anchor: Date): Date {
  const copy = new Date(anchor);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + mondayOffset);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatWeekdayDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDayChip(date: Date): { weekday: string; day: string } {
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: `${date.getDate()}`,
  };
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
