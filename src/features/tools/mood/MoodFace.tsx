import Svg, { Circle, Path } from 'react-native-svg';

import type { MoodTone } from '@/services/api/mySpace';
import { customer } from '@/theme';

/** Soft fills matching website mood tones — SVG faces, not emoji. */
const FACE: Record<MoodTone, { fill: string; stroke: string }> = {
  positive: { fill: customer.green, stroke: customer.greenInk },
  neutral: { fill: customer.gold, stroke: customer.goldInk },
  difficult: { fill: customer.pink, stroke: customer.pinkInk },
};

/**
 * Website mood-face paths (mood-face.blade.php), drawn with react-native-svg.
 * Keys: very-happy, good, neutral, sad, stressed.
 */
export function MoodFace({
  moodKey,
  tone,
  size = 56,
}: {
  moodKey: string;
  tone: MoodTone;
  size?: number;
}) {
  const palette = FACE[tone] ?? FACE.neutral;
  const mouth =
    moodKey === 'very-happy'
      ? 'M20 36c3.2 6 8 9 12 9s8.8-3 12-9'
      : moodKey === 'good'
        ? 'M22 38c2.6 4 6 6 10 6s7.4-2 10-6'
        : moodKey === 'neutral'
          ? 'M22 40h20'
          : moodKey === 'sad'
            ? 'M22 44c2.8-4 6.4-6 10-6s7.2 2 10 6'
            : 'M22 42c3-2 5 2 8 0s5-2 8 0';

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="22" fill={palette.fill} stroke={palette.stroke} strokeWidth={2.2} />
      <Path
        d="M22 28h.1M42 28h.1"
        stroke={palette.stroke}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <Path d={mouth} fill="none" stroke={palette.stroke} strokeWidth={2.4} strokeLinecap="round" />
      {moodKey === 'stressed' ? (
        <Path
          d="M20 22l4 3M44 22l-4 3"
          fill="none"
          stroke={palette.stroke}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}
