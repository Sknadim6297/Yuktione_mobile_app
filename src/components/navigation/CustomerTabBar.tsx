import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamilies, spacing } from '@/theme';

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

type TabDescriptor = {
  options: {
    tabBarLabel?: string;
    title?: string;
  };
};

export type CustomerTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<string, TabDescriptor>;
  navigation: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

type TabVisual = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TAB_VISUAL: Record<string, TabVisual> = {
  home: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  explore: { label: 'Explore', icon: 'compass-outline', iconActive: 'compass' },
  tools: { label: 'Tools', icon: 'grid-outline', iconActive: 'grid' },
  experts: { label: 'Experts', icon: 'people-outline', iconActive: 'people' },
  'my-space': { label: 'My Space', icon: 'person-outline', iconActive: 'person' },
};

/**
 * 5-tab customer chrome from Screen_13/14 (app standard).
 * Home PNG shows 4 tabs — documented remaining difference.
 */
export function CustomerTabBar({ state, descriptors, navigation }: CustomerTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const visual = TAB_VISUAL[route.name] ?? {
          label: route.name,
          icon: 'ellipse-outline' as const,
          iconActive: 'ellipse' as const,
        };
        const options = descriptors[route.key]?.options ?? {};
        const label = options.tabBarLabel ?? options.title ?? visual.label;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.item}
            hitSlop={6}
          >
            <Ionicons
              name={focused ? visual.iconActive : visual.icon}
              size={22}
              color={focused ? colors.brand.eucalyptus : colors.text.muted}
            />
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 10,
    lineHeight: 12,
    color: colors.text.muted,
  },
  labelActive: {
    color: colors.brand.eucalyptus,
    fontWeight: '600',
  },
});
