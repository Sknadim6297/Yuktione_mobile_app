import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { PressCard, RemoteImage, Skeleton } from '@/features/customer/home/media';
import { expertInitials, expertTint } from '@/features/customer/liveCatalog';
import { SpaceBackdrop, SpaceHeader, SpaceTitle } from '@/features/customer/myspace/SpaceDesign';
import { BottomNav } from '@/features/customer/ui';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  EXPERTS_LIVE,
  EXPERTS_PAGE_SIZE,
  EXPERTS_QUERY_MAX,
  experienceLabel,
  expertRole,
  expertTopics,
  formatPrice,
  hasReviews,
  normaliseQuery,
  refineExperts,
  shortExperience,
  SORT_LABELS,
  useDebouncedValue,
  useExpertsDirectory,
  type ExpertFilters,
  type ExpertSort,
} from '@/features/experts/expertsDirectory';
import type { ApiExpert, ApiExpertCategory } from '@/services/api/catalog';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { brand, customer, customerFonts, shadows } from '@/theme';

const PAD = 16;
const GAP = 12;
const MAX_FRAME = 960;

const SUBTITLE = 'Find the right expert for you';

/** The pill border already marks focus; the browser's ring inside it is redundant ('none' is web-only). */
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

function param(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Experts tab — website /professionals (experts.blade.php + partials/pro-expert-card):
 * header → title → search → category chips → count + filter → expert cards.
 */
export function ExpertsDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = Math.min(width, MAX_FRAME);
  const side = (width - frame) / 2 + PAD;
  const content = frame - PAD * 2;
  const columns = content >= 720 ? 2 : 1;
  const cardWidth = Math.floor((content - GAP * (columns - 1)) / columns);

  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const [text, setText] = useState(param(params.q));
  const [category, setCategory] = useState(param(params.category));
  const [filters, setFilters] = useState<ExpertFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const routeKey = `${param(params.category)}\u0000${param(params.q)}`;
  const [seenRouteKey, setSeenRouteKey] = useState(routeKey);
  if (routeKey !== seenRouteKey) {
    setSeenRouteKey(routeKey);
    if (params.category !== undefined) setCategory(param(params.category));
    if (params.q !== undefined) setText(param(params.q));
  }

  const query = useDebouncedValue(normaliseQuery(text));
  const directory = useExpertsDirectory(query, category);
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = directory;
  const firstPage = data?.pages[0];

  const categories = useMemo(() => firstPage?.categories ?? [], [firstPage]);
  const buckets = useMemo(() => firstPage?.experienceBuckets ?? {}, [firstPage]);
  const loaded = useMemo(() => {
    const seen = new Set<number>();
    return (data?.pages ?? []).flatMap((page) => page.experts).filter((expert) => !seen.has(expert.id) && seen.add(expert.id));
  }, [data]);
  const experts = useMemo(() => refineExperts(loaded, filters), [loaded, filters]);
  const total = firstPage?.meta?.total ?? loaded.length;
  const complete = !hasNextPage;
  const ratingAvailable = loaded.some(hasReviews);
  const filterCount = activeFilterCount(filters);

  // Experience and sort run on the device, so they need every page of the current results.
  useEffect(() => {
    if (filterCount > 0 && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [filterCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const typing = normaliseQuery(text) !== query;
  const updating = typing || (directory.isFetching && directory.isPlaceholderData);
  const categoryLabel = categories.find((item) => item.slug === category)?.label;

  const clearSearch = useCallback(() => setText(''), []);
  const resetAll = useCallback(() => {
    setText('');
    setCategory('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await directory.refetch();
    setRefreshing(false);
  }, [directory]);

  const renderItem = useCallback(
    ({ item }: { item: ApiExpert }) => <ExpertCard expert={item} width={cardWidth} />,
    [cardWidth],
  );

  const shown = filters.experience ? experts.length : total;
  const countLabel =
    filters.experience && !complete ? 'Counting experts…' : `${shown} ${shown === 1 ? 'Expert' : 'Experts'} Found`;

  const header = (
    <View style={[styles.headerStack, { paddingTop: Math.max(insets.top, 10) }]}>
      <View pointerEvents="none" style={[styles.backdrop, { left: -side, right: -side, height: insets.top + 250 }]}>
        <SpaceBackdrop height={insets.top + 250} />
      </View>
      <SpaceHeader right={<DiscoverHeaderActions />} />
      <SpaceTitle title="Experts" subtitle={SUBTITLE} />
      {EXPERTS_LIVE ? (
        <>
          <ExpertSearch value={text} onChange={setText} busy={updating && Boolean(text)} />
          {categories.length ? (
            <CategoryChips categories={categories} selected={category} onSelect={setCategory} side={side} />
          ) : null}
          {data ? (
            <View style={styles.toolbar}>
              <Text style={styles.count} accessibilityLiveRegion="polite">
                {countLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={filterCount ? `Filter, ${filterCount} active` : 'Filter'}
                onPress={() => setSheetOpen(true)}
                hitSlop={6}
                style={({ pressed }) => [styles.filterButton, filterCount > 0 && styles.filterButtonOn, pressed && styles.pressed]}
              >
                <Ionicons name="filter-outline" size={17} color={filterCount ? brand.white : brand.plum} />
                <Text style={[styles.filterText, filterCount > 0 && styles.filterTextOn]}>Filter</Text>
                {filterCount ? <Text style={styles.filterBadge}>{filterCount}</Text> : null}
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (!EXPERTS_LIVE) {
    empty = (
      <StatePanel
        icon="cloud-offline-outline"
        title="Experts are unavailable"
        body="The YuktiOne server address is not configured in this build, so experts can't be loaded."
      />
    );
  } else if (directory.isPending) {
    empty = <SkeletonList count={columns * 3} width={cardWidth} />;
  } else if (directory.isError) {
    empty = (
      <StatePanel
        icon="cloud-offline-outline"
        title="We couldn't load experts"
        body={directory.error.message}
        primary={{ label: 'Try again', onPress: () => void directory.refetch() }}
      />
    );
  } else if (filters.experience && !complete) {
    empty = <SkeletonList count={columns * 2} width={cardWidth} />;
  } else if (loaded.length > 0 && filters.experience) {
    empty = (
      <StatePanel
        icon="options-outline"
        title="No experts with this experience"
        body={`No experts here list ${buckets[filters.experience] ?? 'that experience'}. Try another experience range.`}
        primary={{ label: 'Reset filters', onPress: () => setFilters(DEFAULT_FILTERS) }}
      />
    );
  } else if (query) {
    empty = (
      <StatePanel
        icon="search-outline"
        title="No matching experts"
        body={`No experts match “${query}”${categoryLabel ? ` in ${categoryLabel}` : ''}. Try fewer characters or clear the search.`}
        primary={{ label: 'Clear search', onPress: clearSearch }}
        secondary={category ? { label: 'Search all categories', onPress: () => setCategory('') } : undefined}
      />
    );
  } else if (category) {
    empty = (
      <StatePanel
        icon="people-outline"
        title={`No ${categoryLabel ?? 'category'} experts yet`}
        body="No accepted experts are listed in this category right now. Try another category."
        primary={{ label: 'View all experts', onPress: resetAll }}
      />
    );
  } else {
    empty = (
      <StatePanel
        icon="people-outline"
        title="No experts listed yet"
        body="When professionals are accepted and active, they will appear here."
      />
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        key={`cols-${columns}`}
        data={directory.isError ? [] : experts}
        keyExtractor={(expert) => String(expert.id)}
        renderItem={renderItem}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnRow : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          isFetchingNextPage && !directory.isError ? (
            <View style={styles.more} accessibilityLabel="Loading more experts">
              <ActivityIndicator color={brand.plum} />
            </View>
          ) : complete && loaded.length > EXPERTS_PAGE_SIZE && experts.length > 0 ? (
            <Text style={styles.footnote}>
              {filters.experience ? `All ${experts.length} matching experts shown` : `All ${total} experts shown`}
            </Text>
          ) : undefined
        }
        contentContainerStyle={[styles.list, { paddingHorizontal: side }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews={false}
        refreshControl={
          EXPERTS_LIVE ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.plum} colors={[brand.plum]} />
          ) : undefined
        }
      />
      <BottomNav preset="discover" active="experts" />
      <FilterSheet
        key={sheetOpen ? 'open' : 'closed'}
        visible={sheetOpen}
        value={filters}
        buckets={buckets}
        ratingAvailable={ratingAvailable}
        loaded={loaded}
        total={total}
        complete={complete}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

function ExpertSearch({ value, onChange, busy }: { value: string; onChange: (value: string) => void; busy: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused]}>
      <Ionicons name="search-outline" size={20} color={focused ? brand.plum : customer.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search experts or specialization..."
        placeholderTextColor={customer.muted}
        maxLength={EXPERTS_QUERY_MAX}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search experts or specialization"
        style={[styles.searchInput, WEB_NO_OUTLINE]}
      />
      {busy ? <ActivityIndicator size="small" color={brand.plum} accessibilityLabel="Searching" /> : null}
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
  selected,
  onSelect,
  side,
}: {
  categories: ApiExpertCategory[];
  selected: string;
  onSelect: (slug: string) => void;
  side: number;
}) {
  const options = [{ slug: '', label: 'All' }, ...categories];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -side }}
      contentContainerStyle={[styles.chipRow, { paddingHorizontal: side }]}
      accessibilityRole="tablist"
      accessibilityLabel="Expert categories"
    >
      {options.map((option) => {
        const on = option.slug === selected;
        return (
          <Pressable
            key={option.slug || 'all'}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={option.slug ? option.label : 'All experts'}
            onPress={() => onSelect(option.slug)}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

function openProfile(id: number) {
  router.push({ pathname: '/experts/profile/[id]', params: { id: String(id) } });
}

export const ExpertCard = memo(function ExpertCard({ expert, width }: { expert: ApiExpert; width: number }) {
  const role = expertRole(expert);
  const topics = expertTopics(expert);
  const experience = shortExperience(expert.experience);
  const price = formatPrice(expert.starting_price);
  const rated = hasReviews(expert);
  const photo = Math.round(Math.min(Math.max(width * 0.26, 84), 112));
  const name = expert.name.replace(/-/g, '\u2011');
  const summary = [
    expert.name,
    role,
    topics.join(', '),
    experience && `${experienceLabel(expert.experience)} experience`,
    rated && `Rated ${expert.rating} from ${expert.review_count} reviews`,
    price && `From ${price} per session`,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <PressCard
      onPress={() => openProfile(expert.id)}
      label={summary}
      hint="Opens this expert's profile"
      style={[styles.card, { width }]}
    >
      <RemoteImage
        uri={resolveImageUrl(expert.photo_url)}
        background={expertTint(expert.id)}
        fallback={
          <View style={[styles.initialsBox, { backgroundColor: expertTint(expert.id) }]}>
            <Text style={styles.initials}>{expertInitials(expert.name)}</Text>
          </View>
        }
        style={[styles.photo, { width: photo, height: Math.round(photo * 1.1) }]}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {role ? (
          <Text style={styles.role} numberOfLines={1}>
            {role}
          </Text>
        ) : null}
        {topics.length ? (
          <Text style={styles.topics} numberOfLines={1}>
            {topics.join('  •  ')}
          </Text>
        ) : null}
        {experience || rated ? (
          <View style={styles.metaRow}>
            {rated ? (
              <View style={styles.meta}>
                <Ionicons name="star" size={13} color="#E0A106" />
                <Text style={styles.metaStrong}>{expert.rating?.toFixed(1)}</Text>
                <Text style={styles.metaText}>({expert.review_count})</Text>
              </View>
            ) : null}
            {experience ? (
              <View style={styles.meta}>
                <Ionicons name="briefcase-outline" size={13} color={brand.plum} />
                <Text style={styles.metaStrong}>{experience}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.foot}>
          {price ? (
            <Text style={styles.price} numberOfLines={1}>
              <Text style={styles.priceFrom}>From </Text>
              {price}
            </Text>
          ) : null}
          <View style={styles.action}>
            <Text style={styles.actionText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={13} color={brand.plum} />
          </View>
        </View>
      </View>
    </PressCard>
  );
});

function FilterSheet({
  visible,
  value,
  buckets,
  ratingAvailable,
  loaded,
  total,
  complete,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: ExpertFilters;
  buckets: Record<string, string>;
  ratingAvailable: boolean;
  loaded: ApiExpert[];
  total: number;
  complete: boolean;
  onClose: () => void;
  onApply: (value: ExpertFilters) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const preview = draft.experience
    ? `${refineExperts(loaded, draft).length}${complete ? '' : '+'}`
    : String(total);
  const experienceOptions = [{ key: '', label: 'Any experience' }, ...Object.entries(buckets).map(([key, label]) => ({ key, label }))];
  const sorts = (Object.keys(SORT_LABELS) as ExpertSort[]).filter((key) => key !== 'rating' || ratingAvailable);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filters" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} accessibilityViewIsModal>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              Filter experts
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={brand.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {experienceOptions.length > 1 ? (
              <>
                <Text style={styles.sheetLabel}>Experience</Text>
                <View style={styles.optionWrap} accessibilityRole="radiogroup" accessibilityLabel="Experience">
                  {experienceOptions.map((option) => (
                    <Option
                      key={option.key || 'any'}
                      label={option.label}
                      on={draft.experience === option.key}
                      onPress={() => setDraft((current) => ({ ...current, experience: option.key }))}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <Text style={styles.sheetLabel}>Sort by</Text>
            <View style={styles.optionWrap} accessibilityRole="radiogroup" accessibilityLabel="Sort by">
              {sorts.map((key) => (
                <Option
                  key={key}
                  label={SORT_LABELS[key]}
                  on={draft.sort === key}
                  onPress={() => setDraft((current) => ({ ...current, sort: key }))}
                />
              ))}
            </View>
          </ScrollView>
          <View style={styles.sheetActions}>
            <View style={styles.flexFill}>
              <SecondaryButton label="Reset" onPress={() => setDraft(DEFAULT_FILTERS)} />
            </View>
            <View style={styles.flexFill}>
              <PrimaryButton label={`Show ${preview} experts`} onPress={() => onApply(draft)} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Option({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={on}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
    >
      {on ? <Ionicons name="checkmark" size={15} color={brand.white} /> : null}
      <Text style={[styles.optionText, on && styles.optionTextOn]}>{label}</Text>
    </Pressable>
  );
}

function SkeletonList({ count, width }: { count: number; width: number }) {
  return (
    <View style={styles.skeletonList} accessibilityLabel="Loading experts">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} style={{ width, height: 128, borderRadius: 20 }} />
      ))}
    </View>
  );
}

export function StatePanel({
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
  flexFill: { flex: 1 },

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
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.divider,
    backgroundColor: brand.white,
  },
  chipOn: { backgroundColor: brand.plum, borderColor: brand.plum, ...shadows.brand },
  chipText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  chipTextOn: { color: brand.white },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 40 },
  count: { flex: 1, fontFamily: customerFonts.bold, fontSize: 17, letterSpacing: -0.2, color: brand.ink },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: brand.plumSoftDeep,
    backgroundColor: brand.white,
  },
  filterButtonOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  filterText: { fontFamily: customerFonts.semibold, fontSize: 14, color: brand.plum },
  filterTextOn: { color: brand.white },
  filterBadge: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: brand.plum,
    backgroundColor: brand.white,
    minWidth: 18,
    textAlign: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3E6ED',
    backgroundColor: brand.white,
    ...shadows.sm,
  },
  photo: { borderRadius: 14, overflow: 'hidden' },
  initialsBox: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: customerFonts.bold, fontSize: 26, color: brand.plum, letterSpacing: 0.5 },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: customerFonts.bold, fontSize: 16.5, lineHeight: 21, letterSpacing: -0.2, color: brand.ink },
  role: { fontFamily: customerFonts.medium, fontSize: 13, lineHeight: 18, color: '#3D3D4A' },
  topics: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 16, color: brand.grey },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 2, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaStrong: { fontFamily: customerFonts.semibold, fontSize: 12.5, color: brand.ink },
  metaText: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey },
  foot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 6, marginTop: 6 },
  price: { flexShrink: 0, fontFamily: customerFonts.bold, fontSize: 13.5, color: brand.ink },
  priceFrom: { fontFamily: customerFonts.regular, fontSize: 11.5, color: brand.grey },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    marginLeft: 'auto',
    paddingLeft: 12,
    paddingRight: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: brand.plumSoftDeep,
    backgroundColor: brand.plumSoft,
  },
  actionText: { fontFamily: customerFonts.semibold, fontSize: 12.5, color: brand.plum },

  more: { paddingVertical: 12, alignItems: 'center' },
  footnote: {
    fontFamily: customerFonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: brand.grey,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
  },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(26,26,34,0.45)' },
  sheet: {
    maxHeight: '85%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: brand.white,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 6,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: brand.divider, marginBottom: 6 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: customerFonts.bold, fontSize: 19, color: brand.ink },
  sheetBody: { gap: 10, paddingVertical: 8 },
  sheetLabel: { fontFamily: customerFonts.semibold, fontSize: 14, color: brand.ink, marginTop: 6 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.divider,
    backgroundColor: brand.white,
  },
  optionOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  optionText: { fontFamily: customerFonts.medium, fontSize: 13, color: brand.ink },
  optionTextOn: { color: brand.white, fontFamily: customerFonts.semibold },
  sheetActions: { flexDirection: 'row', gap: 10, paddingTop: 10 },

  skeletonList: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
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
