export type PreviewExpert = {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  experience: string;
  specialties: string[];
  tags: string[];
};

/** Screen 24 design-preview experts (Mental Wellbeing). Not live API data. */
export const MENTAL_WELLBEING_EXPERTS: PreviewExpert[] = [
  {
    id: 'ananya',
    name: 'Dr. Ananya Sen',
    title: 'Clinical Psychologist',
    rating: 4.9,
    reviews: 320,
    experience: '8+ years experience',
    specialties: ['Anxiety', 'Stress', 'Mood'],
    tags: ['Anxiety', 'Stress', 'Mood'],
  },
  {
    id: 'rohan',
    name: 'Dr. Rohan Mukherjee',
    title: 'Counselling Psychologist',
    rating: 4.8,
    reviews: 218,
    experience: '6+ years experience',
    specialties: ['Relationships', 'Work Stress'],
    tags: ['Stress', 'Mood'],
  },
  {
    id: 'priya',
    name: 'Ms. Priya Das',
    title: 'Mental Health Counsellor',
    rating: 4.8,
    reviews: 176,
    experience: '5+ years experience',
    specialties: ['Self-Esteem', 'Life Balance'],
    tags: ['Self-Esteem', 'Mood'],
  },
  {
    id: 'arjun',
    name: 'Mr. Arjun Roy',
    title: 'Therapist & Mindfulness Coach',
    rating: 4.7,
    reviews: 143,
    experience: '7+ years experience',
    specialties: ['Mindfulness', 'Sleep', 'Stress'],
    tags: ['Sleep', 'Stress', 'Mood'],
  },
];

export const EXPERT_FILTER_CHIPS = [
  'All',
  'Anxiety',
  'Stress',
  'Mood',
  'Sleep',
  'Self-Esteem',
] as const;
