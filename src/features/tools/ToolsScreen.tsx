import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/brand';
import { DiscoverHeaderActions } from '@/features/customer/DiscoverHeaderActions';
import { Skeleton } from '@/features/customer/home/media';
import { SpaceBackdrop, SpaceHeader, SpaceTitle } from '@/features/customer/myspace/SpaceDesign';
import { BottomNav } from '@/features/customer/ui';
import { ToolTile, toolTileHeight } from '@/features/tools/ToolTile';
import {
  allToolsCount,
  categoryCounts,
  getRememberedToolFilters,
  matchesCategory,
  matchesQuery,
  normaliseQuery,
  rememberToolFilters,
  TOOLS_LIVE,
  TOOLS_PAGE_SIZE,
  TOOLS_QUERY_MAX,
  useToolsCatalogue,
  websiteListed,
} from '@/features/tools/toolsCatalogue';
import type { ApiExploreCategory, ApiTool } from '@/services/api/catalog';
import { brand, customer, customerFonts, shadows } from '@/theme';

const PAD = 16;
const GAP = 12;
const MAX_FRAME = 960;

/** Website tools.blade.php hero lead. */
const SUBTITLE = 'Tools for your growth';

/** The pill border already marks focus; the browser's ring inside it is redundant ('none' is web-only). */
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

function columnsFor(content: number): number {
  if (content >= 860) return 4;
  if (content >= 600) return 3;
  if (content >= 280) return 2;
  return 1;
}

/**
 * Tools tab — website /tools (tools.blade.php + partials/tools-catalog.blade.php):
 * header → title → search → category chips → result count → tool grid → pager.
 */
export function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = Math.min(width, MAX_FRAME);
  const side = (width - frame) / 2 + PAD;
  const content = frame - PAD * 2;
  const columns = columnsFor(content);
  const cardWidth = Math.floor((content - GAP * (columns - 1)) / columns);

  const remembered = getRememberedToolFilters();
  const [text, setRawText] = useState(remembered.query);
  const [category, setRawCategory] = useState(remembered.category);
  const [visible, setVisible] = useState(TOOLS_PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);

  const catalogue = useToolsCatalogue();
  const query = normaliseQuery(useDeferredValue(text));

  const setText = useCallback((value: string) => {
    setRawText(value);
    setVisible(TOOLS_PAGE_SIZE);
  }, []);
  const setCategory = useCallback((value: string) => {
    setRawCategory(value);
    setVisible(TOOLS_PAGE_SIZE);
  }, []);

  useEffect(() => {
    rememberToolFilters({ query: text, category });
  }, [text, category]);

  const listed = useMemo(() => websiteListed(catalogue.data?.tools ?? []), [catalogue.data]);
  const categories = useMemo(() => catalogue.data?.exploreCategories ?? [], [catalogue.data]);
  const validCategory = categories.some((item) => item.slug === category) ? category : '';

  const matched = useMemo(
    () => listed.filter((tool) => matchesCategory(tool, validCategory) && matchesQuery(tool, query)),
    [listed, validCategory, query],
  );
  const counts = useMemo(() => categoryCounts(listed, categories, query), [listed, categories, query]);
  const allCount = allToolsCount(matched.length, counts, validCategory);
  const filtering = query !== '' || validCategory !== '';
  const page = matched.slice(0, visible);

  const clearFilters = useCallback(() => {
    setText('');
    setCategory('');
  }, [setText, setCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await catalogue.refetch();
    setRefreshing(false);
  }, [catalogue]);

  const renderItem = useCallback(
    ({ item }: { item: ApiTool }) => <ToolTile tool={item} width={cardWidth} />,
    [cardWidth],
  );

  const header = (
    <View style={[styles.headerStack, { paddingTop: Math.max(insets.top, 10) }]}>
      <View pointerEvents="none" style={[styles.backdrop, { left: -side, right: -side, height: insets.top + 250 }]}>
        <SpaceBackdrop height={insets.top + 250} />
      </View>
      <SpaceHeader right={<DiscoverHeaderActions />} />
      <SpaceTitle title="Tools" subtitle={SUBTITLE} />
      {TOOLS_LIVE && catalogue.data ? (
        <>
          <ToolSearch value={text} onChange={setText} />
          <CategoryChips
            categories={categories}
            counts={counts}
            allCount={allCount}
            selected={validCategory}
            onSelect={setCategory}
            side={side}
          />
          <View style={styles.toolbar}>
            <Text style={styles.count} accessibilityLiveRegion="polite">
              Showing {matched.length} {matched.length === 1 ? 'tool' : 'tools'}
              {filtering ? <Text style={styles.countHint}> matching filters</Text> : null}
            </Text>
            {filtering ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
                onPress={clearFilters}
                hitSlop={8}
                style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={15} color={brand.plum} />
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (!TOOLS_LIVE) {
    empty = (
      <StatePanel
        icon="cloud-offline-outline"
        title="Tools are unavailable"
        body="The YuktiOne server address is not configured in this build, so tools can't be loaded."
      />
    );
  } else if (catalogue.isPending) {
    empty = <SkeletonGrid columns={columns} cardWidth={cardWidth} />;
  } else if (catalogue.isError) {
    empty = (
      <StatePanel
        icon="cloud-offline-outline"
        title="We couldn't load tools"
        body={catalogue.error.message}
        primary={{ label: 'Try again', onPress: () => void catalogue.refetch() }}
      />
    );
  } else if (filtering) {
    const label = categories.find((item) => item.slug === validCategory)?.label;
    empty = (
      <StatePanel
        icon="search-outline"
        title="No tools match these filters"
        body="Try another category or search term, or clear filters to browse everything available."
        primary={{ label: 'Clear filters', onPress: clearFilters }}
        secondary={
          validCategory && query ? { label: `Keep ${label ?? 'category'}`, onPress: () => setText('') } : undefined
        }
      />
    );
  } else {
    empty = (
      <StatePanel
        icon="grid-outline"
        title="No published tools yet"
        body="When a tool is ready for everyone, it will appear in this catalogue."
      />
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        key={`cols-${columns}`}
        data={catalogue.isError ? [] : page}
        keyExtractor={(tool) => tool.slug}
        renderItem={renderItem}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnRow : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          matched.length > visible ? (
            <View style={styles.pager}>
              <Text style={styles.pagerText}>
                Showing {page.length} of {matched.length}
              </Text>
              <SecondaryButton
                label="Show more tools"
                compact
                onPress={() => setVisible((value) => value + TOOLS_PAGE_SIZE)}
              />
            </View>
          ) : undefined
        }
        contentContainerStyle={[styles.list, { paddingHorizontal: side }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews={false}
        refreshControl={
          TOOLS_LIVE ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.plum} colors={[brand.plum]} />
          ) : undefined
        }
      />
      <BottomNav preset="discover" active="tools" />
    </View>
  );
}

function ToolSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused]}>
      <Ionicons name="search-outline" size={20} color={focused ? brand.plum : customer.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search tools..."
        placeholderTextColor={customer.muted}
        maxLength={TOOLS_QUERY_MAX}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search tools"
        style={[styles.searchInput, WEB_NO_OUTLINE]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange('')} hitSlop={10}>
          <Ionicons name="close-circle" size={20} color={customer.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const CategoryChips = memo(function CategoryChips({
  categories,
  counts,
  allCount,
  selected,
  onSelect,
  side,
}: {
  categories: ApiExploreCategory[];
  counts: Record<string, number>;
  allCount: number;
  selected: string;
  onSelect: (slug: string) => void;
  side: number;
}) {
  const options = [
    { slug: '', label: 'All', count: allCount },
    ...categories.map((item) => ({ slug: item.slug, label: item.label, count: counts[item.slug] ?? 0 })),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -side }}
      contentContainerStyle={[styles.chipRow, { paddingHorizontal: side }]}
      accessibilityRole="tablist"
      accessibilityLabel="Tool categories"
    >
      {options.map((option) => {
        const on = option.slug === selected;
        return (
          <Pressable
            key={option.slug || 'all'}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={`${option.slug ? option.label : 'All Tools'}, ${option.count} ${option.count === 1 ? 'tool' : 'tools'}`}
            onPress={() => onSelect(option.slug)}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{option.label}</Text>
            <Text style={[styles.chipCount, on && styles.chipCountOn]}>{option.count}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

function SkeletonGrid({ columns, cardWidth }: { columns: number; cardWidth: number }) {
  return (
    <View style={styles.skeletonGrid} accessibilityLabel="Loading tools">
      {Array.from({ length: Math.max(columns * 2, 4) }, (_, index) => (
        <Skeleton key={index} style={{ width: cardWidth, height: toolTileHeight(cardWidth), borderRadius: 20 }} />
      ))}
    </View>
  );
}

function StatePanel({
  icon,
  title,
  body,
  primary,
  secondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.state} accessibilityRole="summary">
      <View style={styles.stateMark}>
        <Ionicons name={icon} size={26} color={brand.plum} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {primary || secondary ? (
        <View style={styles.stateActions}>
          {primary ? <PrimaryButton label={primary.label} onPress={primary.onPress} compact /> : null}
          {secondary ? <SecondaryButton label={secondary.label} onPress={secondary.onPress} compact /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customer.canvas },
  list: { paddingBottom: 28, gap: GAP },
  headerStack: { gap: 16, marginBottom: 2 },
  backdrop: { position: 'absolute', top: 0 },
  columnRow: { gap: GAP },
  pressed: { opacity: 0.8 },

  search: {
    minHeight: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: customer.line,
    backgroundColor: brand.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadows.sm,
  },
  searchFocused: { borderColor: brand.plum },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: brand.ink,
    paddingVertical: 12,
  },

  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.divider,
    backgroundColor: brand.white,
  },
  chipOn: { backgroundColor: brand.plum, borderColor: brand.plum, ...shadows.brand },
  chipText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  chipTextOn: { color: brand.white },
  chipCount: {
    fontFamily: customerFonts.semibold,
    fontSize: 11,
    color: brand.grey,
    minWidth: 18,
    textAlign: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: brand.plumSoft,
  },
  chipCountOn: { color: brand.plum, backgroundColor: brand.white },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 34 },
  count: { flex: 1, fontFamily: customerFonts.bold, fontSize: 15, color: brand.ink },
  countHint: { fontFamily: customerFonts.regular, fontSize: 13, color: brand.grey },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.plumSoftDeep,
    backgroundColor: brand.white,
  },
  clearText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.plum },

  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  pager: { alignItems: 'center', gap: 10, paddingTop: 8 },
  pagerText: { fontFamily: customerFonts.medium, fontSize: 13, color: brand.grey },

  state: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 22,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  stateMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: brand.plumSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.ink, textAlign: 'center' },
  stateBody: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: brand.grey, textAlign: 'center' },
  stateActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8 },
});
