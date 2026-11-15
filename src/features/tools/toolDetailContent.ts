import type { PreviewTool } from '@/features/tools/toolCatalog';

export type ToolFeature = {
  title: string;
  subtitle: string;
  icon: 'image-outline' | 'text-outline' | 'sparkles-outline' | 'list-outline' | 'leaf-outline' | 'stats-chart-outline' | 'flash-outline' | 'flower-outline' | 'refresh-outline' | 'create-outline' | 'book-outline' | 'heart-outline';
  tone: 'green' | 'lavender' | 'peach';
};

export type ToolDetailContent = {
  hero: string;
  about: string;
  features: ToolFeature[];
  cta: string;
  /** Optional route after primary CTA (frontend tour). */
  nextHref?: string;
};

/**
 * Screen 16 / 17 / 20 copy from Screens/*.png.
 * Journal has no unique PNG yet — uses the Free tool pattern with catalog copy.
 */
export const TOOL_DETAIL_CONTENT: Record<string, ToolDetailContent> = {
  'mood-board': {
    hero: 'Express how you feel',
    about:
      'Create a simple visual board to capture your current mood, thoughts and vibes.',
    features: [
      {
        title: 'Pick images',
        subtitle: 'Choose what matches your mood',
        icon: 'image-outline',
        tone: 'green',
      },
      {
        title: 'Add a note',
        subtitle: 'Write a few words (optional)',
        icon: 'text-outline',
        tone: 'lavender',
      },
      {
        title: 'Reflect',
        subtitle: 'Notice how you feel after creating it',
        icon: 'sparkles-outline',
        tone: 'peach',
      },
    ],
    cta: 'Create My Mood Board',
    nextHref: '/tools/mood-board/result',
  },
  'classic-journal': {
    hero: 'Write freely and reflect',
    about:
      'A private space to capture thoughts, feelings and daily reflections in your own words.',
    features: [
      {
        title: 'Free writing',
        subtitle: 'No prompts required',
        icon: 'create-outline',
        tone: 'green',
      },
      {
        title: 'Gentle structure',
        subtitle: 'Optional prompts when you need them',
        icon: 'book-outline',
        tone: 'lavender',
      },
      {
        title: 'Look back',
        subtitle: 'Notice patterns over time',
        icon: 'heart-outline',
        tone: 'peach',
      },
    ],
    cta: 'Start Journaling',
  },
  'guided-questions': {
    hero: 'Go deeper with thoughtful questions',
    about:
      'A guided reflection experience with carefully curated questions to help you gain clarity, self-awareness and new perspectives.',
    features: [
      {
        title: 'Structured prompts',
        subtitle: 'Focus on what really matters',
        icon: 'list-outline',
        tone: 'green',
      },
      {
        title: 'Build insights',
        subtitle: 'Understand your thoughts and patterns',
        icon: 'leaf-outline',
        tone: 'lavender',
      },
      {
        title: 'Track growth',
        subtitle: 'See your progress over time',
        icon: 'stats-chart-outline',
        tone: 'peach',
      },
    ],
    cta: 'Unlock & Start',
  },
  'daily-reset': {
    hero: 'Quick exercises to refresh your mind',
    about:
      'A short, simple exercise to calm your mind, boost your mood and reset your focus.',
    features: [
      {
        title: 'Quick & easy',
        subtitle: 'Just a few minutes a day.',
        icon: 'flash-outline',
        tone: 'green',
      },
      {
        title: 'Feel better',
        subtitle: 'Reduce stress and feel calmer.',
        icon: 'flower-outline',
        tone: 'lavender',
      },
      {
        title: 'Reset anytime',
        subtitle: 'Use it whenever you need a refresh.',
        icon: 'refresh-outline',
        tone: 'peach',
      },
    ],
    cta: 'Start Daily Reset',
  },
};

export function getToolDetailContent(
  tool: PreviewTool,
): ToolDetailContent | undefined {
  return TOOL_DETAIL_CONTENT[tool.id];
}
