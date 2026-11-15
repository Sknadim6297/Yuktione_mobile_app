export type MoodOption = {
  id: string;
  label: string;
  emoji: string;
};

/** Mood chips from Screen_11 Home reference (design preview). */
export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'great', label: 'Great', emoji: '😊' },
  { id: 'good', label: 'Good', emoji: '🙂' },
  { id: 'okay', label: 'Okay', emoji: '😐' },
  { id: 'low', label: 'Low', emoji: '😔' },
  { id: 'stressed', label: 'Stressed', emoji: '😣' },
];
