import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand, customer, customerFonts } from '@/theme';

type NoticeTone = 'error' | 'success' | 'info';

const TONES: Record<NoticeTone, { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }> = {
  error: { icon: 'alert-circle-outline', color: customer.danger, background: '#FCEBEE' },
  success: { icon: 'checkmark-circle-outline', color: customer.free, background: '#EAF6EF' },
  info: { icon: 'information-circle-outline', color: brand.plum, background: brand.plumSoft },
};

/** Inline message. Used instead of Alert, which does nothing on web builds. */
export function AuthNotice({
  tone,
  message,
  action,
}: {
  tone: NoticeTone;
  message: string;
  action?: { label: string; onPress: () => void };
}) {
  const palette = TONES[tone];
  return (
    <View
      style={[styles.notice, { backgroundColor: palette.background }]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={palette.icon} size={18} color={palette.color} style={styles.noticeIcon} />
      <View style={styles.noticeBody}>
        <Text style={[styles.noticeText, { color: palette.color }]}>{message}</Text>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
            <Text style={[styles.noticeAction, { color: palette.color }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const STEPS = ['Your details', 'Verify email', 'Password'];

/** Customer registration: details → email code → password. */
export function AuthSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={styles.steps} accessibilityLabel={`Step ${current} of 3: ${STEPS[current - 1]}`}>
      {STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.stepTrack}>
              <View style={[styles.stepLine, index === 0 && styles.stepLineHidden, number <= current && styles.stepLineOn]} />
              <View style={[styles.stepDot, (done || active) && styles.stepDotOn]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color={brand.white} />
                ) : (
                  <Text style={[styles.stepNumber, active && styles.stepNumberOn]}>{number}</Text>
                )}
              </View>
              <View
                style={[
                  styles.stepLine,
                  index === STEPS.length - 1 && styles.stepLineHidden,
                  number < current && styles.stepLineOn,
                ]}
              />
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelOn]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Footer line such as "New here? Create an account". */
export function AuthSwitch({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <Text style={styles.switch}>
      {prompt}{' '}
      <Text style={styles.switchLink} onPress={onPress} accessibilityRole="link">
        {action}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  noticeIcon: { marginTop: 1 },
  noticeBody: { flex: 1, minWidth: 0 },
  noticeText: { fontFamily: customerFonts.medium, fontSize: 13, lineHeight: 18 },
  noticeAction: { fontFamily: customerFonts.bold, fontSize: 13, marginTop: 6, textDecorationLine: 'underline' },

  steps: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 5 },
  stepTrack: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: brand.plumSoftDeep },
  stepLineHidden: { backgroundColor: 'transparent' },
  stepLineOn: { backgroundColor: brand.plum },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: brand.plumSoftDeep,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
  },
  stepDotOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  stepNumber: { fontFamily: customerFonts.bold, fontSize: 12, color: brand.grey },
  stepNumberOn: { color: brand.white },
  stepLabel: { fontFamily: customerFonts.medium, fontSize: 11.5, color: brand.grey },
  stepLabelOn: { fontFamily: customerFonts.bold, color: brand.plum },

  switch: { textAlign: 'center', fontFamily: customerFonts.regular, color: customer.body, fontSize: 14 },
  switchLink: { color: brand.plum, fontFamily: customerFonts.bold },
});
