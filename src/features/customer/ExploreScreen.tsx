import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { formatInr } from '@/features/customer/content';
import { PillButton, SearchEntry, SectionNotice } from '@/features/customer/home/blocks';
import { PressCard, RemoteImage, Skeleton } from '@/features/customer/home/media';
import {
  expertInitials,
  expertTint,
  openLiveTool,
  toolHref,
  toolVisual,
} from '@/features/customer/liveCatalog';
import { CustomerPage, IconButton, SectionTitle } from '@/features/customer/ui';
import {
  fetchExperts,
  fetchProgrammeEvents,
  type ApiExpert,
  type ApiExpertCategory,
  type ApiProgrammeEvent,
  type ApiTool,
} from '@/services/api/catalog';
import { resolveImageUrl, websiteImage } from '@/services/media/imageUrl';
import { selectTools, useToolsCatalogue } from '@/features/tools/toolsCatalogue';
import { customer, customerFonts, shadows } from '@/theme';

const LIVE = !FRONTEND_ONLY && isApiConfigured();
const GAP = 12;
const EXPERT_PREVIEW = 6;
const TOOL_PREVIEW = 6;

type Tab = 'experts' | 'tools' | 'programmes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'experts', label: 'Experts' },
  { id: 'tools', label: 'Tools' },
  { id: 'programmes', label: 'Programmes' },
];

type Category = Pick<ApiExpertCategory, 'slug' | 'label'>;

function columnsFor(width: number): number {
  if (width >= 840) return 4;
  if (width >= 560) return 3;
  return 2;
}

function tileWidth(width: number, columns: number): number {
  return Math.floor((width - GAP * (columns - 1)) / columns);
}

function openExpert(id: number): void {
  router.push({ pathname: '/experts/profile/[id]', params: { id: String(id) } });
}

/** Tools that run in the app first; website-only tools keep the website's order after them. */
function rankTools(tools: ApiTool[]): ApiTool[] {
  return [
    ...tools.filter((tool) => toolHref(tool) !== null),
    ...tools.filter((tool) => toolHref(tool) === null),
  ];
}

export function ExploreScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(width - 32, 280);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const resultsY = useRef(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [tab, setTab] = useState<Tab>('experts');
  const [refreshing, setRefreshing] = useState(false);
  const slug = category?.slug ?? null;

  // Same request and cache entry as Home's featured experts; every experts response lists the categories.
  const directory = useQuery({
    queryKey: ['v1', 'experts', 'featured'],
    queryFn: async () => {
      const result = await fetchExperts({ featured: true, limit: 8 });
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    enabled: LIVE,
  });

  const experts = useQuery({
    queryKey: ['v1', 'experts', 'explore', slug],
    queryFn: async () => {
      const result = await fetchExperts({ category: slug ?? undefined, limit: 24 });
      if (!result.ok) throw new Error(result.message);
      return result.experts;
    },
    enabled: LIVE && tab === 'experts',
  });

  const tools = useToolsCatalogue({
    select: selectTools,
    enabled: LIVE && tab === 'tools' && slug === null,
  });

  const programmes = useQuery({
    queryKey: ['v1', 'programme-events', 'explore', slug],
    queryFn: async () => {
      const result = await fetchProgrammeEvents({ category: slug ?? undefined });
      if (!result.ok) throw new Error(result.message);
      return result.events;
    },
    enabled: LIVE && tab === 'programmes',
  });

  const categories = useMemo(
    () => (directory.data?.categories ?? []).filter((item) => item.slug && item.label),
    [directory.data],
  );

  const selectCategory = useCallback((next: ApiExpertCategory) => {
    setCategory((current) => (current?.slug === next.slug ? null : { slug: next.slug, label: next.label }));
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(resultsY.current - 8, 0), animated: true });
    });
  }, []);

  const clearCategory = useCallback(() => setCategory(null), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const visible =
      tab === 'experts' ? experts.refetch() : tab === 'programmes' ? programmes.refetch() : slug ? null : tools.refetch();
    await Promise.allSettled([directory.refetch(), visible]);
    setRefreshing(false);
  }, [tab, slug, directory, experts, tools, programmes]);

  return (
    <CustomerPage
      nav="discover"
      active="explore"
      scrollRef={scrollRef}
      refreshing={refreshing}
      onRefresh={LIVE ? onRefresh : undefined}
      right={<IconButton icon="search-outline" label="Search" onPress={() => router.push('/search')} />}
    >
      <View style={styles.intro}>
        <Text style={styles.title} accessibilityRole="header">
          Explore
        </Text>
        <Text style={styles.subtitle}>Discover guidance that fits your journey.</Text>
      </View>

      <SearchEntry />
      <DiscoveryBanner width={contentWidth} />

      {!LIVE ? (
        <StateCard
          icon="cloud-offline-outline"
          title="Explore needs a connection"
          body="Connect to the YuktiOne server to browse experts, tools and programmes."
        />
      ) : (
        <>
          <View style={styles.section}>
            <SectionTitle title="Explore by category" />
            {directory.isPending ? (
              <CategorySkeleton width={contentWidth} />
            ) : directory.isError ? (
              <SectionNotice
                text="We couldn't load categories right now."
                action="Try again"
                onAction={() => void directory.refetch()}
              />
            ) : categories.length === 0 ? (
              <SectionNotice text="Categories will appear here once they're published." />
            ) : (
              <CategoryGrid
                categories={categories}
                selected={slug}
                onSelect={selectCategory}
                width={contentWidth}
              />
            )}
          </View>

          <View
            style={styles.section}
            onLayout={(event) => {
              resultsY.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.resultsHead}>
              <View style={styles.resultsTitleWrap}>
                <Text style={styles.resultsKicker}>{category ? 'Showing results for' : 'Showing'}</Text>
                <Text style={styles.resultsTitle} numberOfLines={1} accessibilityRole="header">
                  {category ? category.label : 'All categories'}
                </Text>
              </View>
              {category ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Clear ${category.label} filter`}
                  onPress={clearCategory}
                  hitSlop={6}
                  style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}
                >
                  <Text style={styles.clearText}>Clear</Text>
                  <Ionicons name="close" size={16} color={customer.tealDark} />
                </Pressable>
              ) : null}
            </View>

            <TabBar value={tab} onChange={setTab} compact={contentWidth < 330} />

            {tab === 'experts' ? (
              <ExpertsPanel
                query={experts}
                category={category}
                width={contentWidth}
                onClear={clearCategory}
              />
            ) : tab === 'tools' ? (
              <ToolsPanel query={tools} category={category} width={contentWidth} onClear={clearCategory} />
            ) : (
              <ProgrammesPanel
                query={programmes}
                category={category}
                width={contentWidth}
                onClear={clearCategory}
                onBrowseExperts={() => setTab('experts')}
              />
            )}
          </View>
        </>
      )}
    </CustomerPage>
  );
}

/** The photo's people sit on the left, so the copy goes over the empty corridor on the right. */
function DiscoveryBanner({ width }: { width: number }) {
  const wide = width >= 600;
  return (
    <RemoteImage
      uri={websiteImage('consultation')}
      background={customer.navy}
      fallback={<View />}
      style={[styles.banner, { minHeight: wide ? 200 : 172 }]}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="exploreBannerScrim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={customer.navy} stopOpacity="0" />
            <Stop offset="0.42" stopColor={customer.navy} stopOpacity="0.45" />
            <Stop offset="0.62" stopColor={customer.navy} stopOpacity="0.86" />
            <Stop offset="1" stopColor={customer.navy} stopOpacity="0.94" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#exploreBannerScrim)" />
      </Svg>
      <View style={[styles.bannerContent, { width: wide ? '46%' : width < 360 ? '62%' : '58%' }]}>
        <Text style={styles.bannerTitle} accessibilityRole="header">
          Find What Moves You Forward
        </Text>
        <Text style={styles.bannerBody}>Explore expert guidance and tools for every stage of life.</Text>
      </View>
    </RemoteImage>
  );
}

function CategoryGrid({
  categories,
  selected,
  onSelect,
  width,
}: {
  categories: ApiExpertCategory[];
  selected: string | null;
  onSelect: (category: ApiExpertCategory) => void;
  width: number;
}) {
  const columns = columnsFor(width);
  const tile = tileWidth(width, columns);
  const height = Math.round(tile * (columns === 2 ? 0.82 : 0.74));
  const loneLast = columns === 2 && categories.length % 2 === 1;
  return (
    <View style={styles.grid}>
      {categories.map((item, index) => (
        <CategoryTile
          key={item.slug}
          category={item}
          selected={item.slug === selected}
          onSelect={onSelect}
          width={loneLast && index === categories.length - 1 ? width : tile}
          height={height}
        />
      ))}
    </View>
  );
}

const CategoryTile = memo(function CategoryTile({
  category,
  selected,
  onSelect,
  width,
  height,
}: {
  category: ApiExpertCategory;
  selected: boolean;
  onSelect: (category: ApiExpertCategory) => void;
  width: number;
  height: number;
}) {
  return (
    <PressCard
      onPress={() => onSelect(category)}
      label={category.label}
      hint={selected ? 'Clears this category filter' : 'Shows experts and programmes for this category'}
      selected={selected}
      style={[styles.tile, { width, height }]}
    >
      <RemoteImage uri={resolveImageUrl(category.image_url)} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="exploreTileScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.38" stopColor={customer.navy} stopOpacity="0" />
            <Stop offset="1" stopColor={customer.navy} stopOpacity="0.78" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#exploreTileScrim)" />
      </Svg>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {category.label}
      </Text>
      {selected ? (
        <>
          <View style={styles.tileRing} pointerEvents="none" />
          <View style={styles.tileCheck}>
            <Ionicons name="checkmark" size={15} color={customer.white} />
          </View>
        </>
      ) : null}
    </PressCard>
  );
});

function CategorySkeleton({ width }: { width: number }) {
  const columns = columnsFor(width);
  const tile = tileWidth(width, columns);
  const height = Math.round(tile * (columns === 2 ? 0.82 : 0.74));
  return (
    <View style={styles.grid} accessibilityLabel="Loading categories">
      {Array.from({ length: columns * 2 }, (_, index) => (
        <Skeleton key={index} style={{ width: tile, height, borderRadius: 18 }} />
      ))}
    </View>
  );
}

function TabBar({ value, onChange, compact }: { value: Tab; onChange: (tab: Tab) => void; compact: boolean }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {TABS.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            aria-selected={selected}
            onPress={() => onChange(item.id)}
            style={[styles.tab, compact && styles.tabCompact, selected && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, compact && styles.tabTextCompact, selected && styles.tabTextActive]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type PanelQuery<T> = {
  data: T[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
};

function ExpertsPanel({
  query,
  category,
  width,
  onClear,
}: {
  query: PanelQuery<ApiExpert>;
  category: Category | null;
  width: number;
  onClear: () => void;
}) {
  const columns = width >= 600 ? 2 : 1;
  const cardWidth = tileWidth(width, columns);

  if (query.isPending) return <ListSkeleton count={3} width={cardWidth} height={112} columns={columns} />;
  if (query.isError) return <ErrorState what="experts" onRetry={() => void query.refetch()} />;

  const list = query.data ?? [];
  if (list.length === 0) {
    return (
      <StateCard
        icon="people-outline"
        title={category ? `No ${category.label} experts yet` : 'No experts yet'}
        body={
          category
            ? 'Approved experts for this category will appear here.'
            : 'Experts will appear here once their profiles are approved.'
        }
        primary={category ? { label: 'Show all experts', onPress: onClear } : undefined}
      />
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.grid}>
        {list.slice(0, EXPERT_PREVIEW).map((expert) => (
          <ExpertRow key={expert.id} expert={expert} width={cardWidth} />
        ))}
      </View>
      <ViewAll
        label={category ? `View all ${category.label} experts` : 'View all experts'}
        onPress={() =>
          category
            ? router.push({ pathname: '/experts/browse', params: { category: category.slug, label: category.label } })
            : router.push('/(tabs)/experts')
        }
      />
    </View>
  );
}

function ToolsPanel({
  query,
  category,
  width,
  onClear,
}: {
  query: PanelQuery<ApiTool>;
  category: Category | null;
  width: number;
  onClear: () => void;
}) {
  const columns = columnsFor(width);
  const cardWidth = tileWidth(width, columns);
  const ranked = useMemo(() => rankTools(query.data ?? []), [query.data]);

  if (category) {
    return (
      <StateCard
        icon="information-circle-outline"
        title={`Tools aren't grouped by ${category.label}`}
        body="YuktiOne tools are organised in their own groups, not by these categories, so we don't filter them here."
        primary={{ label: 'Browse all tools', onPress: () => router.push('/(tabs)/tools') }}
        secondary={{ label: 'Clear category', onPress: onClear }}
      />
    );
  }
  if (query.isPending) return <ListSkeleton count={columns * 2} width={cardWidth} height={230} columns={columns} />;
  if (query.isError) return <ErrorState what="tools" onRetry={() => void query.refetch()} />;
  if (ranked.length === 0) {
    return <StateCard icon="grid-outline" title="No tools yet" body="Tools will appear here once they're published." />;
  }

  const shown = ranked.slice(0, TOOL_PREVIEW);
  return (
    <View style={styles.panel}>
      <View style={styles.grid}>
        {shown.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} width={cardWidth} />
        ))}
      </View>
      {shown.some((tool) => toolHref(tool) === null) ? (
        <Text style={styles.caption}>Tools marked “On the website” can&apos;t run in the app yet.</Text>
      ) : null}
      <ViewAll label={`View all ${ranked.length} tools`} onPress={() => router.push('/(tabs)/tools')} />
    </View>
  );
}

function ProgrammesPanel({
  query,
  category,
  width,
  onClear,
  onBrowseExperts,
}: {
  query: PanelQuery<ApiProgrammeEvent>;
  category: Category | null;
  width: number;
  onClear: () => void;
  onBrowseExperts: () => void;
}) {
  const columns = width >= 600 ? 2 : 1;
  const cardWidth = tileWidth(width, columns);

  if (query.isPending) return <ListSkeleton count={2} width={cardWidth} height={250} columns={columns} />;
  if (query.isError) return <ErrorState what="programmes" onRetry={() => void query.refetch()} />;

  const list = query.data ?? [];
  if (list.length === 0) {
    return (
      <StateCard
        icon="calendar-outline"
        title={category ? `No ${category.label} programmes yet` : 'No programmes right now'}
        body="Workshops and programmes from YuktiOne experts will appear here when they're scheduled."
        primary={category ? { label: 'Show all programmes', onPress: onClear } : { label: 'Browse experts', onPress: onBrowseExperts }}
      />
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.grid}>
        {list.map((event) => (
          <ProgrammeCard key={event.id} event={event} width={cardWidth} />
        ))}
      </View>
      <Text style={styles.caption}>Enrolment isn&apos;t available in the app yet.</Text>
      <ViewAll label="View all programmes" onPress={() => router.push('/programmes')} />
    </View>
  );
}

const ExpertRow = memo(function ExpertRow({ expert, width }: { expert: ApiExpert; width: number }) {
  const specialty = expert.specialization ?? expert.services[0] ?? null;
  const rated = expert.rating != null && expert.review_count > 0;
  const hasMeta = expert.verified || rated || Boolean(expert.starting_price);
  return (
    <PressCard
      onPress={() => openExpert(expert.id)}
      label={`${expert.name}${specialty ? `, ${specialty}` : ''}${expert.verified ? ', verified' : ''}`}
      hint="Opens the expert's profile"
      style={[styles.expert, { width }]}
    >
      <RemoteImage
        uri={resolveImageUrl(expert.photo_url)}
        background={expertTint(expert.id)}
        fallback={
          <View style={styles.initialsWrap}>
            <Text style={styles.initials}>{expertInitials(expert.name)}</Text>
          </View>
        }
        style={styles.expertPhoto}
      />
      <View style={styles.expertBody}>
        <Text style={styles.expertName} numberOfLines={1}>
          {expert.name}
        </Text>
        {specialty ? (
          <Text style={styles.expertSpecialty} numberOfLines={1}>
            {specialty}
          </Text>
        ) : null}
        {hasMeta ? (
          <View style={styles.expertMeta}>
            {expert.verified ? (
              <View style={styles.metaItem}>
                <Ionicons name="checkmark-circle" size={14} color={customer.teal} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
            {rated ? (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={12} color="#D99A2B" />
                <Text style={styles.metaText}>
                  {expert.rating!.toFixed(1)} ({expert.review_count})
                </Text>
              </View>
            ) : null}
            {expert.starting_price ? (
              <Text style={styles.metaText}>From {formatInr(expert.starting_price)}</Text>
            ) : null}
          </View>
        ) : null}
        <View style={styles.link}>
          <Text style={styles.linkText}>View profile</Text>
          <Ionicons name="arrow-forward" size={14} color={customer.teal} />
        </View>
      </View>
    </PressCard>
  );
});

const ToolCard = memo(function ToolCard({ tool, width }: { tool: ApiTool; width: number }) {
  const visual = toolVisual(tool);
  const inApp = toolHref(tool) !== null;
  return (
    <PressCard
      onPress={() => openLiveTool(tool)}
      label={tool.name}
      hint={inApp ? 'Opens the tool' : 'Explains how to use this tool on the website'}
      style={[styles.tool, { width }]}
    >
      <RemoteImage
        uri={resolveImageUrl(tool.image_url)}
        resizeMode="contain"
        inset={10}
        background={visual.tint}
        style={styles.toolImage}
      />
      <View style={styles.toolBody}>
        <Text style={styles.toolName} numberOfLines={2}>
          {tool.name}
        </Text>
        <Text style={styles.toolBlurb} numberOfLines={2}>
          {tool.description}
        </Text>
        {inApp ? (
          <View style={[styles.link, styles.toolLink]}>
            <Text style={styles.linkText}>Open tool</Text>
            <Ionicons name="arrow-forward" size={14} color={customer.teal} />
          </View>
        ) : (
          <View style={[styles.link, styles.toolLink]}>
            <Ionicons name="globe-outline" size={14} color={customer.muted} />
            <Text style={styles.websiteText}>On the website</Text>
          </View>
        )}
      </View>
    </PressCard>
  );
});

const ProgrammeCard = memo(function ProgrammeCard({ event, width }: { event: ApiProgrammeEvent; width: number }) {
  const date = new Date(event.date);
  const when = Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <PressCard
      onPress={() => router.push('/programmes')}
      label={event.heading}
      hint="Opens Programmes"
      style={[styles.programme, { width }]}
    >
      <RemoteImage uri={resolveImageUrl(event.card_image_url)} style={styles.programmeImage} />
      <View style={styles.programmeBody}>
        <Text style={styles.programmeTitle} numberOfLines={2}>
          {event.heading}
        </Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {[when, event.mini_heading].filter(Boolean).join(' · ')}
        </Text>
        {event.professional?.name ? (
          <Text style={styles.metaText} numberOfLines={1}>
            With {event.professional.name}
          </Text>
        ) : null}
        {event.starting_fees ? (
          <Text style={styles.programmeFee}>From {formatInr(event.starting_fees)}</Text>
        ) : null}
      </View>
    </PressCard>
  );
});

function ViewAll({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.viewAll, pressed && styles.viewAllPressed]}
    >
      <Text style={styles.viewAllText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="arrow-forward" size={16} color={customer.teal} />
    </Pressable>
  );
}

function ListSkeleton({
  count,
  width,
  height,
  columns,
}: {
  count: number;
  width: number;
  height: number;
  columns: number;
}) {
  return (
    <View style={styles.grid} accessibilityLabel="Loading">
      {Array.from({ length: Math.max(count, columns) }, (_, index) => (
        <Skeleton key={index} style={{ width, height, borderRadius: 18 }} />
      ))}
    </View>
  );
}

function ErrorState({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <StateCard
      icon="cloud-offline-outline"
      title={`We couldn't load ${what}`}
      body="Check your connection and try again."
      primary={{ label: 'Try again', onPress: onRetry }}
    />
  );
}

function StateCard({
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
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={22} color={customer.teal} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {primary || secondary ? (
        <View style={styles.stateActions}>
          {primary ? <PillButton label={primary.label} onPress={primary.onPress} tone="teal" /> : null}
          {secondary ? (
            <Pressable
              accessibilityRole="button"
              onPress={secondary.onPress}
              style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
            >
              <Text style={styles.secondaryText}>{secondary.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 4, marginTop: 2 },
  title: {
    fontFamily: customerFonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: customer.navy,
    letterSpacing: -0.5,
  },
  subtitle: { fontFamily: customerFonts.regular, fontSize: 15, lineHeight: 21, color: customer.body },

  banner: { borderRadius: 20, justifyContent: 'center', alignItems: 'flex-end' },
  bannerContent: { paddingVertical: 20, paddingRight: 18, paddingLeft: 4, gap: 6 },
  bannerTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 20,
    lineHeight: 25,
    color: customer.white,
    letterSpacing: -0.3,
  },
  bannerBody: { fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.88)' },

  section: { gap: 12, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  panel: { gap: 12 },

  tile: {
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: customer.cream,
    ...shadows.sm,
  },
  tileLabel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontFamily: customerFonts.bold,
    fontSize: 15,
    lineHeight: 19,
    color: customer.white,
  },
  tileRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: customer.teal,
  },
  tileCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: customer.white,
  },

  resultsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  resultsTitleWrap: { flex: 1, gap: 1 },
  resultsKicker: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.muted },
  resultsTitle: { fontFamily: customerFonts.bold, fontSize: 20, lineHeight: 26, color: customer.navy, letterSpacing: -0.2 },
  clear: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: customer.mint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearPressed: { backgroundColor: customer.mintDeep },
  clearText: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.tealDark },

  tabs: {
    flexDirection: 'row',
    backgroundColor: customer.chip,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabCompact: { paddingHorizontal: 2 },
  tabActive: { backgroundColor: customer.white, ...shadows.sm },
  tabText: { fontFamily: customerFonts.medium, fontSize: 14, color: customer.muted },
  tabTextCompact: { fontSize: 13 },
  tabTextActive: { fontFamily: customerFonts.bold, color: customer.navy },

  expert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
  },
  expertPhoto: { width: 84, height: 88, borderRadius: 14 },
  initialsWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: customerFonts.bold, fontSize: 26, color: customer.navy, opacity: 0.75 },
  expertBody: { flex: 1, gap: 3 },
  expertName: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  expertSpecialty: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body },
  expertMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 2, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.tealDark },
  metaText: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.muted },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  linkText: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },
  websiteText: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.muted },

  tool: {
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
    overflow: 'hidden',
  },
  toolImage: { height: 116 },
  toolBody: { padding: 12, gap: 4, flex: 1 },
  toolName: { fontFamily: customerFonts.bold, fontSize: 14, lineHeight: 18, color: customer.navy },
  toolBlurb: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: customer.body },
  toolLink: { marginTop: 'auto', paddingTop: 8 },

  programme: {
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
    overflow: 'hidden',
  },
  programmeImage: { height: 150 },
  programmeBody: { padding: 14, gap: 4 },
  programmeTitle: { fontFamily: customerFonts.bold, fontSize: 16, lineHeight: 21, color: customer.navy },
  programmeFee: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal, marginTop: 2 },

  caption: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: customer.muted },
  viewAll: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  viewAllPressed: { backgroundColor: customer.cream },
  viewAllText: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.teal },

  state: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 20,
    gap: 6,
  },
  stateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: customer.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: { fontFamily: customerFonts.bold, fontSize: 16, lineHeight: 22, color: customer.navy },
  stateBody: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: customer.body },
  stateActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 8 },
  secondary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  secondaryPressed: { opacity: 0.7 },
  secondaryText: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.teal },
});
