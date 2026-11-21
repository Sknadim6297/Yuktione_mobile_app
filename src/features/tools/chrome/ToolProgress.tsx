import { StyleSheet, Text, View } from 'react-native';

import { customer, customerFonts } from '@/theme';

export type ToolProgressStep = {
  id: string;
  label: string;
};

/** Compact step rail used across premium multi-step tools. */
export function ToolProgress({
  steps,
  current,
  accent = customer.teal,
  accentSoft = customer.mintDeep,
  ink = customer.navy,
}: {
  steps: ToolProgressStep[];
  current: string;
  /** Optional wellness teal for new tools; defaults keep Mood/Journal plum chrome. */
  accent?: string;
  accentSoft?: string;
  ink?: string;
}) {
  const index = Math.max(0, steps.findIndex((step) => step.id === current));
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`Step ${index + 1} of ${steps.length}`}
    >
      <View style={styles.row}>
        {steps.map((step, stepIndex) => {
          const done = stepIndex < index;
          const active = stepIndex === index;
          return (
            <View key={step.id} style={styles.segment}>
              <View
                style={[
                  styles.bar,
                  done && { backgroundColor: accentSoft },
                  active && { backgroundColor: accent },
                ]}
              />
              <Text
                style={[styles.label, active && { ...styles.labelOn, color: ink }]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.meta}>
        Step {index + 1} of {steps.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, gap: 6 },
  bar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: customer.line,
  },
  label: {
    fontFamily: customerFonts.medium,
    fontSize: 11,
    color: customer.muted,
  },
  labelOn: {
    fontFamily: customerFonts.bold,
  },
  meta: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: customer.muted,
  },
});
