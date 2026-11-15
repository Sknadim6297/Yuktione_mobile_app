export type ExpertCategory = {
  id: string;
  title: string;
  description: string;
  icon: 'heart-outline' | 'flower-outline' | 'people-outline' | 'briefcase-outline';
  tone: 'green' | 'lavender' | 'peach' | 'blue';
};

/** Screen 23 — Experts category directory. */
export const EXPERT_CATEGORIES: ExpertCategory[] = [
  {
    id: 'mental-wellbeing',
    title: 'Mental Wellbeing',
    description: 'Anxiety, stress, mood and more',
    icon: 'heart-outline',
    tone: 'green',
  },
  {
    id: 'mindfulness-balance',
    title: 'Mindfulness & Balance',
    description: 'Meditation, focus and emotional balance',
    icon: 'flower-outline',
    tone: 'lavender',
  },
  {
    id: 'relationship-family',
    title: 'Relationship & Family',
    description: 'Communication, family and bonding',
    icon: 'people-outline',
    tone: 'peach',
  },
  {
    id: 'work-life',
    title: 'Work & Life',
    description: 'Career, productivity and life balance',
    icon: 'briefcase-outline',
    tone: 'blue',
  },
];
