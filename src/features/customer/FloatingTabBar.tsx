import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient } from '@/components/brand';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { brand, customer, customerFonts, motion } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export type FloatingTab = {
  id: string;
  label: string;
  /** Filled glyph shown while the tab is active. */
  icon: IconName;
  /** Outline glyph shown while inactive. */
  outlineIcon: IconName;
};

/** Pill geometry. Everything else derives from the window so it scales across devices. */
const ITEM_HEIGHT = 56;
const PAD = 6;
const BORDER = 1;
const MAX_WIDTH = 440;
const RADIUS = (ITEM_HEIGHT + PAD * 2 + BORDER * 2) / 2;
const ICON_SIZE = 23;

/**
 * Each tab screen mounts its own bar, so the bar remembers where the highlight last sat.
 * The newly focused screen starts from that spot and slides to its own tab, which reads
 * as one continuous floating bar instead of five separate ones.
 */
let lastActiveIndex: number | null = null;

function moveHighlight(position: SharedValue<number>, to: number, animate: boolean) {
  'worklet';
  position.value = animate
    ? withTiming(to, { duration: motion.duration.normal, easing: Easing.out(Easing.cubic) })
    : to;
}

function setVisible(visible: SharedValue<number>, to: number, animate: boolean) {
  'worklet';
  visible.value = animate ? withTiming(to, { duration: motion.duration.fast }) : to;
}

function placeHighlight(position: SharedValue<number>, at: number) {
  'worklet';
  position.value = at;
}

export function FloatingTabBar({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: FloatingTab[];
  /** Id of the active tab; may match none (e.g. Programmes), then no highlight is shown. */
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
  const margin = width < 340 ? 8 : width < 360 ? 10 : 16;
  const barWidth = Math.min(width - margin * 2, MAX_WIDTH);
  const itemWidth = (barWidth - (PAD + BORDER) * 2) / tabs.length;
  // Breathing room on every side so the highlight never touches the pill edge.
  const highlightWidth = Math.min(itemWidth - 6, 76);
  const highlightLeft = (itemWidth - highlightWidth) / 2;
  const compact = itemWidth < 62;
  const tiny = itemWidth < 54;
  const bottomGap = insets.bottom > 0 ? Math.max(insets.bottom - 8, 10) : 10;

  const position = useSharedValue(activeIndex >= 0 ? (lastActiveIndex ?? activeIndex) : 0);
  const visible = useSharedValue(activeIndex >= 0 ? 1 : 0);

  useFocusEffect(
    useCallback(() => {
      if (activeIndex < 0) {
        setVisible(visible, 0, !reduceMotion);
        return;
      }
      const from = lastActiveIndex ?? activeIndex;
      placeHighlight(position, from);
      setVisible(visible, 1, false);
      moveHighlight(position, activeIndex, !reduceMotion && from !== activeIndex);
      lastActiveIndex = activeIndex;
    }, [activeIndex, position, visible, reduceMotion]),
  );

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateX: position.value * itemWidth + highlightLeft }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.dock, { paddingBottom: bottomGap }]}>
      <View style={[styles.shadow, { width: barWidth }]}>
        <View accessibilityRole="tablist" style={styles.pill}>
          <Animated.View
            pointerEvents="none"
            style={[styles.highlight, { width: highlightWidth }, highlightStyle]}
          >
            <BrandGradient colors={[brand.plumSoft, '#F3DCE9']} angle={165} />
          </Animated.View>
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              index={index}
              width={itemWidth}
              selected={index === activeIndex}
              position={position}
              visible={visible}
              compact={compact}
              tiny={tiny}
              onPress={() => onSelect(tab.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function TabButton({
  tab,
  index,
  width,
  selected,
  position,
  visible,
  compact,
  tiny,
  onPress,
}: {
  tab: FloatingTab;
  index: number;
  width: number;
  selected: boolean;
  position: SharedValue<number>;
  visible: SharedValue<number>;
  compact: boolean;
  tiny: boolean;
  onPress: () => void;
}) {
  const iconSize = tiny ? 20 : compact ? 21 : ICON_SIZE;
  // 1 while the highlight sits on this tab, fading to 0 as it slides away.
  const iconBoxStyle = useAnimatedStyle(() => {
    const strength = Math.max(0, 1 - Math.abs(position.value - index)) * visible.value;
    return { transform: [{ scale: 1 + 0.1 * strength }] };
  });
  const filledStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(position.value - index)) * visible.value,
  }));
  const outlineStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, 1 - Math.abs(position.value - index)) * visible.value,
  }));
  const labelStyle = useAnimatedStyle(() => {
    const strength = Math.max(0, 1 - Math.abs(position.value - index)) * visible.value;
    return { color: interpolateColor(strength, [0, 1], [customer.muted, brand.plum]) };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      aria-selected={selected}
      accessibilityLabel={tab.label}
      onPress={onPress}
      style={({ pressed }) => [styles.item, { width }, pressed && styles.itemPressed]}
    >
      <Animated.View style={[styles.iconBox, { width: iconSize, height: iconSize }, iconBoxStyle]}>
        <Animated.View style={[styles.iconLayer, outlineStyle]}>
          <Ionicons name={tab.outlineIcon} size={iconSize} color={customer.muted} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, filledStyle]}>
          <Ionicons name={tab.icon} size={iconSize} color={brand.plum} />
        </Animated.View>
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        // Fixed-size control: system font scaling must never push "My Space" out of its slot.
        allowFontScaling={false}
        style={[
          styles.label,
          compact && styles.labelCompact,
          // Scales with the slot so the longest label ("My Space") always fits.
          tiny && { fontSize: Math.max(8.5, Math.min(9.5, width / 5.4)) },
          selected && styles.labelActive,
          labelStyle,
        ]}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Sits in the page's flex column, so screens never need extra bottom padding.
  dock: { alignItems: 'center', paddingTop: 6, backgroundColor: 'transparent' },
  shadow: {
    borderRadius: RADIUS,
    shadowColor: '#5C1035',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 9 : 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PAD,
    borderRadius: RADIUS,
    borderWidth: BORDER,
    borderColor: 'rgba(138, 15, 77, 0.10)',
    // Translucent surface fallback; kept near-opaque so label contrast never depends on blur.
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // Nothing (highlight, label) can ever draw outside the pill.
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: PAD + 2,
    left: PAD,
    height: ITEM_HEIGHT - 4,
    borderRadius: (ITEM_HEIGHT - 4) / 2 - 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138, 15, 77, 0.08)',
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
    paddingHorizontal: 1,
  },
  itemPressed: { opacity: 0.8 },
  iconBox: { width: ICON_SIZE, height: ICON_SIZE },
  iconLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: customerFonts.medium, fontSize: 11.5, maxWidth: '96%', textAlign: 'center' },
  labelCompact: { fontSize: 10.5 },
  labelActive: { fontFamily: customerFonts.bold },
});
