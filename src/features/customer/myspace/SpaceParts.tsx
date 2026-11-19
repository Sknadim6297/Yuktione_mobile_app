import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/features/customer/home/media';
import { brand, customerFonts } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Website empty-state: icon, title, description, optional action. */
export function SpaceEmpty({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={brand.plum} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
        >
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Placeholder rows while a list loads. */
export function RowSkeletons({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.skeletons} accessibilityLabel="Loading">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <Skeleton style={styles.skeletonAvatar} />
          <View style={styles.skeletonText}>
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },

  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: brand.plumSoftDeep,
    backgroundColor: brand.pearl,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: brand.plumSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: brand.ink, textAlign: 'center' },
  emptyBody: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: brand.grey,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 8,
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: brand.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: { fontFamily: customerFonts.bold, fontSize: 13.5, color: brand.white },

  skeletons: { gap: 14 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonText: { flex: 1, gap: 7 },
  skeletonLine: { height: 13, width: '70%', borderRadius: 6 },
  skeletonLineShort: { height: 11, width: '45%', borderRadius: 6 },
});
