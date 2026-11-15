/**
 * Design-preview tool catalog from Screen_13 / Screen_15.
 * Not live API data — labels match reference cards only.
 */
export type ToolAccess = 'free' | 'paid';

export type PreviewTool = {
  id: string;
  title: string;
  subtitle: string;
  categorySubtitle: string;
  access: ToolAccess;
  icon: 'happy-outline' | 'book-outline' | 'help-circle-outline' | 'sunny-outline';
};

export const PREVIEW_TOOLS: PreviewTool[] = [
  {
    id: 'mood-board',
    title: 'Mood Board',
    subtitle: 'Track your daily emotions',
    categorySubtitle: 'Track your feelings',
    access: 'free',
    icon: 'happy-outline',
  },
  {
    // Distinct from the reference catalog tool id `journal` so both remain reachable.
    id: 'classic-journal',
    title: 'Journal',
    subtitle: 'Reflect and write freely',
    categorySubtitle: 'Write and reflect',
    access: 'free',
    icon: 'book-outline',
  },
  {
    id: 'guided-questions',
    title: 'Guided Questions',
    subtitle: 'Get personalised insights',
    categorySubtitle: 'Understand your needs',
    access: 'paid',
    icon: 'help-circle-outline',
  },
  {
    id: 'daily-reset',
    title: 'Daily Reset',
    subtitle: 'Short calming exercises',
    categorySubtitle: 'Calm your mind',
    access: 'free',
    icon: 'sunny-outline',
  },
];

export function getPreviewTool(id: string): PreviewTool | undefined {
  return PREVIEW_TOOLS.find((tool) => tool.id === id);
}
