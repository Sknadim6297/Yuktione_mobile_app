import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/features/customer/home/media';
import { expertInitials, expertTint } from '@/features/customer/liveCatalog';
import { expertRole } from '@/features/experts/expertsDirectory';
import type { ApiExpert } from '@/services/api/catalog';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { brand, customerFonts, shadows } from '@/theme';

export type BookingStep = 'schedule' | 'review' | 'done';

const STEPS: { id: BookingStep; label: string }[] = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Confirmed' },
];

export function Stepper({ step }: { step: BookingStep }) {
  const current = STEPS.findIndex((item) => item.id === step);
  return (
    <View style={styles.stepper} accessibilityLabel={`Step ${current + 1} of 3: ${STEPS[current]?.label}`}>
      {STEPS.map((item, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={item.id} style={styles.stepItem}>
            <View style={[styles.stepDot, (done || active) && styles.stepDotOn]}>
              {done ? (
                <Ionicons name="checkmark" size={13} color={brand.white} />
              ) : (
                <Text style={[styles.stepNumber, active && styles.stepNumberOn]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelOn]} numberOfLines={1}>
              {item.label}
            </Text>
            {index < STEPS.length - 1 ? <View style={[styles.stepLine, done && styles.stepLineOn]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function StepCard({
  icon,
  title,
  hint,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={18} color={brand.plum} />
        </View>
        <View style={styles.flexFill}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {title}
          </Text>
          {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrongValue]}>{value}</Text>
    </View>
  );
}

const TONES = {
  error: { icon: 'alert-circle' as const, color: '#B42318', background: '#FEF3F2', border: '#FECDCA' },
  info: { icon: 'information-circle' as const, color: brand.plum, background: brand.plumSoft, border: brand.plumSoftDeep },
  success: { icon: 'checkmark-circle' as const, color: '#067647', background: '#ECFDF3', border: '#ABEFC6' },
};

export function Banner({
  tone,
  text,
  action,
}: {
  tone: keyof typeof TONES;
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  const palette = TONES[tone];
  return (
    <View
      style={[styles.banner, { backgroundColor: palette.background, borderColor: palette.border }]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={palette.icon} size={18} color={palette.color} style={styles.bannerIcon} />
      <View style={styles.flexFill}>
        <Text style={[styles.bannerText, { color: palette.color }]}>{text}</Text>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
            <Text style={[styles.bannerAction, { color: palette.color }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ExpertStrip({ expert }: { expert: ApiExpert }) {
  const role = expertRole(expert);
  return (
    <View style={styles.expert}>
      <View style={[styles.avatar, { backgroundColor: expertTint(expert.id) }]}>
        <RemoteImage
          uri={resolveImageUrl(expert.photo_url)}
          label={`Photo of ${expert.name}`}
          background="transparent"
          fallback={
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{expertInitials(expert.name)}</Text>
            </View>
          }
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.flexFill}>
        <View style={styles.nameRow}>
          <Text style={styles.expertName} numberOfLines={1}>
            {expert.name}
          </Text>
          {expert.verified ? <Ionicons name="checkmark-circle" size={16} color={brand.plum} accessibilityLabel="Verified expert" /> : null}
        </View>
        {role ? (
          <Text style={styles.expertRole} numberOfLines={1}>
            {role}
          </Text>
        ) : null}
      </View>
      <View style={styles.onlinePill}>
        <Ionicons name="videocam-outline" size={13} color={brand.plum} />
        <Text style={styles.onlineText}>Online</Text>
      </View>
    </View>
  );
}

export const bookingStyles = StyleSheet.create({
  pill: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.divider,
    backgroundColor: brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: brand.plum, borderColor: brand.plum, ...shadows.brand },
  pillText: { fontFamily: customerFonts.semibold, fontSize: 13.5, color: brand.ink },
  pillTextOn: { color: brand.white },
});

const styles = StyleSheet.create({
  flexFill: { flex: 1, minWidth: 0 },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.plumSoftDeep,
  },
  stepDotOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  stepNumber: { fontFamily: customerFonts.bold, fontSize: 12, color: brand.grey },
  stepNumberOn: { color: brand.white },
  stepLabel: { flexShrink: 1, fontFamily: customerFonts.medium, fontSize: 12, color: brand.grey },
  stepLabelOn: { fontFamily: customerFonts.bold, color: brand.ink },
  stepLine: { flex: 1, minWidth: 6, height: 2, borderRadius: 1, backgroundColor: brand.plumSoftDeep, marginRight: 6 },
  stepLineOn: { backgroundColor: brand.plum },

  card: {
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
    ...shadows.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plumSoft,
  },
  cardTitle: { fontFamily: customerFonts.bold, fontSize: 16.5, color: brand.ink },
  cardHint: { fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 18, color: brand.grey },

  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flexShrink: 1, fontFamily: customerFonts.regular, fontSize: 14, color: '#3D3D4A' },
  rowValue: { fontFamily: customerFonts.semibold, fontSize: 14, color: brand.ink, textAlign: 'right' },
  rowStrong: { fontFamily: customerFonts.bold, fontSize: 15.5, color: brand.ink },
  rowStrongValue: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.plum },

  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1 },
  bannerIcon: { marginTop: 1 },
  bannerText: { fontFamily: customerFonts.medium, fontSize: 13.5, lineHeight: 19 },
  bannerAction: { fontFamily: customerFonts.bold, fontSize: 13.5, marginTop: 6, textDecorationLine: 'underline' },

  expert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.plum },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expertName: { flexShrink: 1, fontFamily: customerFonts.bold, fontSize: 16, color: brand.ink },
  expertRole: { fontFamily: customerFonts.regular, fontSize: 13, color: brand.grey },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: brand.plumSoft,
  },
  onlineText: { fontFamily: customerFonts.semibold, fontSize: 12, color: brand.plum },
});
