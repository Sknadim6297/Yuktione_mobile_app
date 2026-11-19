import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { type ReactNode, type Ref, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { BrandLogo, PrimaryButton, SecondaryButton } from '@/components/brand';
import { FloatingTabBar } from '@/features/customer/FloatingTabBar';
import { useSignOut } from '@/features/customer/useSignOut';
import { brand, customer, customerFonts, shadows } from '@/theme';

export { BrandLogo };

export function IconButton({
  icon,
  label,
  onPress,
  badge,
  filled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: boolean;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[styles.iconButton, filled && styles.iconButtonFilled]}
    >
      <Ionicons name={icon} size={22} color={filled ? customer.white : customer.teal} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

export function ScreenHeader({
  onBack,
  left,
  right,
}: {
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const leading = onBack ? (
    <IconButton icon="chevron-back" label="Go back" onPress={onBack} />
  ) : (
    left ?? <View style={styles.headerSide} />
  );
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.headerSide}>{leading}</View>
      <View style={styles.headerCenter}>
        <BrandLogo width={118} />
      </View>
      <View style={[styles.headerSide, styles.headerActions]}>{right}</View>
    </View>
  );
}

export type NavId =
  | 'home'
  | 'explore'
  | 'tools'
  | 'bookings'
  | 'my-space'
  | 'experts'
  | 'programmes'
  | 'profile'
  | 'progress'
  | 'reports';

export type NavPreset =
  | 'discover'
  | 'experts'
  | 'bookings'
  | 'programmes'
  | 'space'
  | 'my-tools'
  | 'progress'
  | 'reports';

const NAV: Record<
  NavId,
  { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href }
> = {
  home: { label: 'Home', icon: 'home', href: '/(tabs)/home' },
  explore: { label: 'Explore', icon: 'compass', href: '/(tabs)/explore' },
  tools: { label: 'Tools', icon: 'grid', href: '/(tabs)/tools' },
  bookings: { label: 'Bookings', icon: 'calendar', href: '/(tabs)/bookings' },
  'my-space': { label: 'My Space', icon: 'person', href: '/(tabs)/my-space' },
  experts: { label: 'Experts', icon: 'people', href: '/(tabs)/experts' },
  programmes: { label: 'Programmes', icon: 'layers', href: '/programmes' },
  profile: { label: 'Profile', icon: 'person', href: '/(tabs)/my-space' },
  progress: { label: 'My Progress', icon: 'stats-chart', href: '/progress' },
  reports: { label: 'Reports', icon: 'bar-chart', href: '/reports' },
};

/** Primary customer tabs: Home · Explore · Tools · Experts · My Space */
const PRIMARY_TABS: { id: NavId; href?: Href }[] = [
  { id: 'home' },
  { id: 'explore' },
  { id: 'tools' },
  { id: 'experts' },
  { id: 'my-space' },
];

const PRESETS: Record<NavPreset, { id: NavId; href?: Href }[]> = {
  discover: PRIMARY_TABS,
  experts: PRIMARY_TABS,
  bookings: PRIMARY_TABS,
  programmes: PRIMARY_TABS,
  space: PRIMARY_TABS,
  'my-tools': PRIMARY_TABS,
  progress: PRIMARY_TABS,
  reports: PRIMARY_TABS,
};

function outlineIcon(icon: keyof typeof Ionicons.glyphMap): keyof typeof Ionicons.glyphMap {
  const name = `${icon}-outline` as keyof typeof Ionicons.glyphMap;
  return name in Ionicons.glyphMap ? name : icon;
}

/** The one shared bottom bar; every screen renders it through here (see FloatingTabBar). */
export function BottomNav({ preset, active }: { preset: NavPreset; active: NavId }) {
  const items = PRESETS[preset];
  const tabs = items.map((item) => ({
    id: item.id,
    label: NAV[item.id].label,
    icon: NAV[item.id].icon,
    outlineIcon: outlineIcon(NAV[item.id].icon),
  }));
  return (
    <FloatingTabBar
      tabs={tabs}
      activeId={active}
      onSelect={(id) => {
        if (id === active) return;
        const item = items.find((entry) => entry.id === id);
        if (item) router.navigate(item.href ?? NAV[item.id].href);
      }}
    />
  );
}

export function CustomerPage({
  children,
  onBack,
  left,
  right,
  footer,
  nav,
  active,
  refreshing,
  onRefresh,
  dismissKeyboardOnDrag,
  scrollRef,
}: {
  children: ReactNode;
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  nav?: NavPreset;
  active?: NavId;
  /** Pull-to-refresh, shown only when onRefresh is set. */
  refreshing?: boolean;
  onRefresh?: () => void;
  dismissKeyboardOnDrag?: boolean;
  scrollRef?: Ref<ScrollViewInstance>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.page}>
      <ScreenHeader onBack={onBack} left={left} right={right} />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={dismissKeyboardOnDrag ? 'on-drag' : 'none'}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              tintColor={customer.teal}
              colors={[customer.teal]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: nav ? 8 : Math.max(insets.bottom, 12) }]}>
          {footer}
        </View>
      ) : null}
      {nav && active ? <BottomNav preset={nav} active={active} /> : null}
    </View>
  );
}

export function TealButton({
  label,
  onPress,
  icon,
  iconPosition = 'start',
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
}) {
  return (
    <PrimaryButton
      label={label}
      onPress={onPress}
      icon={icon}
      iconPosition={iconPosition}
      disabled={disabled}
    />
  );
}

export function OutlineButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return <SecondaryButton label={label} onPress={onPress} icon={icon} compact />;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  onClear,
  maxLength,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  /** Shows a clear button while there is text. */
  onClear?: () => void;
  maxLength?: number;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={customer.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={customer.muted}
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={maxLength}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />
      {onClear && value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          hitSlop={10}
          style={styles.searchClear}
        >
          <Ionicons name="close" size={14} color={brand.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={[styles.chip, selected && styles.chipOn]}
          >
            {option.icon ? (
              <Ionicons name={option.icon} size={14} color={selected ? customer.white : customer.teal} />
            ) : null}
            <Text style={[styles.chipText, selected && styles.chipTextOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function TrendChart({
  values,
  labels,
  max = 10,
}: {
  values: number[];
  labels: string[];
  max?: number;
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(220, width - 64);
  const height = 150;
  const pad = 16;
  if (values.length === 0) {
    return <Text style={styles.empty}>Check in to start your mood trend.</Text>;
  }
  const step = values.length === 1 ? 0 : (chartWidth - pad * 2) / (values.length - 1);
  const points = values.map((value, index) => ({
    x: pad + step * index,
    y: pad + (1 - Math.min(value, max) / max) * (height - pad * 2),
  }));
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const area = last && first ? `${line} L ${last.x} ${height} L ${first.x} ${height} Z` : '';

  return (
    <View>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={customer.teal} stopOpacity="0.28" />
            <Stop offset="1" stopColor={customer.teal} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {area ? <Path d={area} fill="url(#moodFill)" /> : null}
        <Path d={line} stroke={customer.teal} strokeWidth={3} fill="none" />
        {points.map((point, index) => (
          <Circle
            key={`${point.x}-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 6 : 3.5}
            fill={customer.white}
            stroke={customer.teal}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={[styles.chartLabels, { width: chartWidth }]}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function DonutChart({
  segments,
  center,
}: {
  segments: { value: number; color: string; label: string }[];
  center: string;
}) {
  const size = 104;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const arcs = segments.map((segment, index) => {
    const offset = segments
      .slice(0, index)
      .reduce((sum, item) => sum + item.value, 0);
    const length = (segment.value / total) * circ;
    return {
      label: segment.label,
      color: segment.color,
      length,
      rotation: (offset / total) * 360 - 90,
    };
  });
  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={brand.plumSoft} strokeWidth={stroke} fill="none" />
        {arcs.map((segment) => (
            <Circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${segment.length} ${circ - segment.length}`}
              rotation={segment.rotation}
              originX={size / 2}
              originY={size / 2}
            />
        ))}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutValue}>{total}</Text>
        <Text style={styles.donutCaption}>{center}</Text>
      </View>
    </View>
  );
}

const MENU: { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href }[] = [
  { label: 'Home', icon: 'home-outline', href: '/(tabs)/home' },
  { label: 'Explore', icon: 'compass-outline', href: '/(tabs)/explore' },
  { label: 'All Tools', icon: 'grid-outline', href: '/(tabs)/tools' },
  { label: 'Experts', icon: 'people-outline', href: '/(tabs)/experts' },
  { label: 'Programmes & Events', icon: 'layers-outline', href: '/programmes' },
  { label: 'My Bookings', icon: 'calendar-outline', href: '/(tabs)/bookings' },
  { label: 'My Space', icon: 'person-outline', href: '/(tabs)/my-space' },
  { label: 'My Tools', icon: 'bookmark-outline', href: '/my-tools' },
  { label: 'My Progress', icon: 'stats-chart-outline', href: '/progress' },
  { label: 'Reports', icon: 'bar-chart-outline', href: '/reports' },
  { label: 'Join as a Professional', icon: 'briefcase-outline', href: '/professional/join' },
];

export function AppMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { signOutNow } = useSignOut();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <BrandLogo width={120} />
          </View>
          <ScrollView style={{ maxHeight: 440 }}>
            {MENU.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                onPress={() => {
                  onClose();
                  router.push(item.href);
                }}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={18} color={brand.plum} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={customer.muted} />
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
              onPress={() => {
                onClose();
                void signOutNow();
              }}
            >
              <View style={[styles.menuIcon, styles.menuIconDanger]}>
                <Ionicons name="log-out-outline" size={18} color={customer.danger} />
              </View>
              <Text style={[styles.menuLabel, styles.dangerText]}>Sign out</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function useMenu() {
  const [open, setOpen] = useState(false);
  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
    menu: <AppMenu visible={open} onClose={() => setOpen(false)} />,
  };
}

export const card = {
  backgroundColor: customer.white,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: customer.line,
  ...shadows.sm,
} as const;

/** Website hover-lift card: plum-tinted shadow for featured surfaces. */
export const featuredCard = {
  ...card,
  borderColor: brand.plumSoftDeep,
  ...shadows.md,
  shadowColor: brand.plum,
  shadowOpacity: 0.12,
} as const;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customer.canvas },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customer.canvas,
  },
  headerSide: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerActions: { justifyContent: 'flex-end' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: customer.line,
  },
  iconButtonFilled: { backgroundColor: brand.plum, borderColor: brand.plum },
  badge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.magenta,
    borderWidth: 1.5,
    borderColor: brand.white,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 28, gap: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: customer.canvas },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: customer.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.silver,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: customer.navy,
    paddingVertical: 10,
  },
  searchClear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: customer.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: brand.silver,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  chipText: { fontFamily: customerFonts.semibold, color: customer.navy, fontSize: 13 },
  chipTextOn: { color: customer.white },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 19, color: customer.navy, letterSpacing: -0.3 },
  sectionAction: { fontFamily: customerFonts.bold, fontSize: 13, color: brand.plum },
  heading: {
    fontFamily: customerFonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: customer.navy,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.body,
    marginTop: -6,
  },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10, color: customer.muted, fontFamily: customerFonts.regular },
  empty: { fontFamily: customerFonts.regular, color: customer.muted, fontSize: 13 },
  donutWrap: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutValue: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  donutCaption: { fontFamily: customerFonts.regular, fontSize: 10, color: customer.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(31, 31, 31, 0.42)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: customer.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: brand.silver,
    marginBottom: 6,
  },
  sheetHead: { alignItems: 'flex-start', paddingVertical: 4, marginBottom: 4 },
  menuRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  menuRowPressed: { backgroundColor: brand.pearlDeep },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plumSoft,
  },
  menuIconDanger: { backgroundColor: '#FCEBEE' },
  menuLabel: { flex: 1, fontFamily: customerFonts.semibold, fontSize: 15, color: customer.navy },
  dangerText: { color: customer.danger },
});
