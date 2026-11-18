import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BrandGradient, Eyebrow, PrimaryButton, SecondaryButton } from '@/components/brand';
import { PressCard, RemoteImage, Skeleton } from '@/features/customer/home/media';
import { openLiveTool, toolVisual } from '@/features/customer/liveCatalog';
import { BottomNav, IconButton, ScreenHeader, SearchField } from '@/features/customer/ui';
import {
  allToolsCount,
  cardDescription,
  categoryCounts,
  categoryIcon,
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
import { resolveImageUrl, websiteImage } from '@/services/media/imageUrl';
import { brand, customer, customerFonts, shadows } from '@/theme';

const PAD = 16;
const GAP = 12;

function columnsFor(width: number): number {
  const content = width - PAD * 2;
  if (content >= 680) return 3;
  if (content >= 300) return 2;
  return 1;
}

/**
 * Tools tab — website /tools (tools.blade.php + partials/tools-catalog.blade.php):
 * hero → category chips → results toolbar (count, clear, search) → card grid → pager.
 */
export function ToolsScreen() {
  const { width } = useWindowDimensions();
  const columns = columnsFor(width);
  const cardWidth = (width - PAD * 2 - GAP * (columns - 1)) / columns;

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
    ({ item }: { item: ApiTool }) => <ToolCard tool={item} width={cardWidth} />,
    [cardWidth],
  );

  const header = (
    <View style={styles.headerStack}>
      <ToolsHero width={width} />
      {TOOLS_LIVE && catalogue.data ? (
        <>
          <CategoryChips
            categories={categories}
            counts={counts}
            allCount={allCount}
            selected={validCategory}
            onSelect={setCategory}
          />
          <SearchField
            value={text}
            onChangeText={setText}
            onClear={() => setText('')}
            placeholder="Search tools…"
            accessibilityLabel="Search tools"
            maxLength={TOOLS_QUERY_MAX}
          />
          <View style={styles.toolbar}>
            <Text style={styles.count} accessibilityLiveRegion="polite">
              Showing {matched.length} {matched.length === 1 ? 'tool' : 'tools'}
              {filtering ? <Text style={styles.countHint}> matching filters</Text> : null}
            </Text>
            {filtering ? (
              <Pressable accessibilityRole="button" onPress={clearFilters} hitSlop={8}>
                <Text style={styles.clear}>Clear filters</Text>
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
        icon="grid-outline"
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
      <ScreenHeader
        right={<IconButton icon="bookmark-outline" label="Saved tools" onPress={() => router.push('/my-tools')} />}
      />
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
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
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

function ToolsHero({ width }: { width: number }) {
  const art = Math.round(Math.min(Math.max(width * 0.34, 112), 200));
  return (
    <View style={styles.hero}>
      <BrandGradient colors={['#FFFFFF', brand.pearl, brand.plumSoft]} angle={135} style={StyleSheet.absoluteFill} />
      <View style={styles.heroCopy}>
        <Eyebrow label="Yukti Tools" />
        <Text style={styles.heroTitle} accessibilityRole="header">
          Try Our <Text style={styles.heroAccent}>Tools</Text>
        </Text>
        <Text style={styles.heroLead}>
          Practical tools for mental, emotional and personal growth — open what you need, when you need it.
        </Text>
      </View>
      <RemoteImage
        uri={websiteImage('tools')}
        resizeMode="contain"
        background="transparent"
        fallback={<View />}
        label="Mindful wellness — calm focus with growth, health and clarity"
        style={{ width: art, height: art }}
      />
    </View>
  );
}

const CategoryChips = memo(function CategoryChips({
  categories,
  counts,
  allCount,
  selected,
  onSelect,
}: {
  categories: ApiExploreCategory[];
  counts: Record<string, number>;
  allCount: number;
  selected: string;
  onSelect: (slug: string) => void;
}) {
  const options = [
    { slug: '', label: 'All Tools', icon: 'grid', count: allCount },
    ...categories.map((item) => ({ ...item, count: counts[item.slug] ?? 0 })),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipRail}
      contentContainerStyle={styles.chipRow}
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
            accessibilityLabel={`${option.label}, ${option.count} ${option.count === 1 ? 'tool' : 'tools'}`}
            onPress={() => onSelect(option.slug)}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
          >
            <Ionicons name={categoryIcon(option.icon)} size={15} color={on ? brand.white : brand.plum} />
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{option.label}</Text>
            <Text style={[styles.chipCount, on && styles.chipTextOn, option.count === 0 && !on && styles.chipCountZero]}>
              ({option.count})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const ToolCard = memo(function ToolCard({ tool, width }: { tool: ApiTool; width: number }) {
  const visual = toolVisual(tool);
  const description = cardDescription(tool);
  const artHeight = Math.round(Math.min(width * 0.72, 150));
  return (
    <PressCard
      onPress={() => openLiveTool(tool)}
      label={`${tool.name}. ${description}`}
      hint="Opens this tool"
      style={[styles.card, { width }]}
    >
      <View style={[styles.cardArt, { height: artHeight }]}>
        <BrandGradient colors={[brand.pearl, brand.plumSoft]} angle={160} style={StyleSheet.absoluteFill} />
        <RemoteImage
          uri={resolveImageUrl(tool.image_url)}
          resizeMode="contain"
          inset={10}
          background="transparent"
          fallback={
            <View style={styles.artFallback}>
              <Ionicons name={visual.icon} size={40} color={brand.plum} />
            </View>
          }
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.cardIcon, { backgroundColor: visual.tint }]}>
          <Ionicons name={visual.icon} size={16} color={visual.ink} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {tool.name}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={3}>
          {description}
        </Text>
        <View style={styles.cardGo}>
          <View style={styles.cardGoIcon}>
            <Ionicons name="arrow-forward" size={14} color={brand.white} />
          </View>
        </View>
      </View>
    </PressCard>
  );
});

function SkeletonGrid({ columns, cardWidth }: { columns: number; cardWidth: number }) {
  return (
    <View style={styles.skeletonGrid} accessibilityLabel="Loading tools">
      {Array.from({ length: columns * 2 }, (_, index) => (
        <Skeleton key={index} style={{ width: cardWidth, height: 260, borderRadius: 20 }} />
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
  list: { paddingHorizontal: PAD, paddingBottom: 28, gap: GAP },
  headerStack: { gap: 14, marginBottom: 2 },
  columnRow: { gap: GAP },
  pressed: { opacity: 0.85 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  heroCopy: { flex: 1, gap: 8 },
  heroTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.8,
    color: brand.ink,
  },
  heroAccent: { color: brand.plum },
  heroLead: { fontFamily: customerFonts.regular, fontSize: 13.5, lineHeight: 20, color: brand.grey },

  chipRail: { marginHorizontal: -PAD },
  chipRow: { paddingHorizontal: PAD, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.silver,
    backgroundColor: brand.white,
  },
  chipOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  chipText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  chipTextOn: { color: brand.white },
  chipCount: { fontFamily: customerFonts.medium, fontSize: 12, color: brand.grey },
  chipCountZero: { opacity: 0.7 },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  count: { flex: 1, fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  countHint: { fontFamily: customerFonts.regular, color: brand.grey },
  clear: { fontFamily: customerFonts.bold, fontSize: 13, color: brand.plum },

  card: {
    flexGrow: 0,
    backgroundColor: brand.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brand.divider,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardArt: { overflow: 'hidden' },
  artFallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -27,
    borderWidth: 2,
    borderColor: brand.white,
  },
  cardTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
    color: brand.ink,
    minHeight: 38,
  },
  cardDesc: { flex: 1, fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 17, color: brand.grey, minHeight: 51 },
  cardGo: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 4 },
  cardGoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: brand.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
