import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export type BenefitRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

export function BenefitRow({ icon, title, description }: BenefitRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.brand.eucalyptus} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.eucalyptusSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
