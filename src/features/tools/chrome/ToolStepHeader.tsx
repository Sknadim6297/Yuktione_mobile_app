import { StyleSheet, Text, View } from 'react-native';

import { customer, customerFonts } from '@/theme';

export function ToolStepHeader({
  eyebrow,
  title,
  body,
  accent = customer.tealDark,
  ink = customer.navy,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  /** Optional wellness accents for new tools; defaults keep Mood/Journal plum chrome. */
  accent?: string;
  ink?: string;
}) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, { color: ink }]} accessibilityRole="header">
        {title}
      </Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  eyebrow: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: customerFonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: customer.body,
  },
});
