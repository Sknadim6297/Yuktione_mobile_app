import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type GradientStop = { color: string; opacity: number };

function parseStop(input: string): GradientStop {
  const match = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(input);
  if (!match) return { color: input, opacity: 1 };
  const [, r, g, b, a] = match;
  return { color: `rgb(${r}, ${g}, ${b})`, opacity: Number(a) };
}

/**
 * CSS-style linear gradient (angle in degrees, like `linear-gradient(145deg, …)`).
 * Rendered with react-native-svg so no extra native module is required.
 */
export function BrandGradient({
  colors,
  angle = 180,
  style,
}: {
  colors: readonly string[];
  angle?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = Math.cos(rad) / 2;
  const stops = colors.map(parseStop);
  const last = Math.max(1, stops.length - 1);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1={0.5 - dx} y1={0.5 + dy} x2={0.5 + dx} y2={0.5 - dy}>
            {stops.map((stop, index) => (
              <Stop
                key={`${stop.color}-${index}`}
                offset={index / last}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
