import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SecondaryButton } from '@/components/brand';
import {
  CATEGORY_LABELS,
  CATEGORY_TABS,
  CATEGORY_TAGLINES,
  normaliseTab,
  useCategoryProgrammes,
  type CategoryTab,
} from '@/features/categories/categoryHub';
import { DiscoverHeaderActions } from '@/features/customer/DiscoverHeaderActions';
import { EventCard } from '@/features/customer/home/HomeSections';
import { Skeleton } from '@/features/customer/home/media';
import { SpaceBackdrop, SpaceTitle } from '@/features/customer/myspace/SpaceDesign';
import { BottomNav, IconButton } from '@/features/customer/ui';
import { ExpertCard, StatePanel } from '@/features/experts/ExpertsDirectoryScreen';
import { EXPERTS_LIVE, useExpertsDirectory } from '@/features/experts/expertsDirectory';
import { ToolTile, toolTileHeight } from '@/features/tools/ToolTile';
import { matchesCategory, selectTools, useToolsCatalogue, websiteListed } from '@/features/tools/toolsCatalogue';
import { brand, customer, customerFonts, shadows } from '@/theme';

const PAD = 16;
const GAP = 12;
const MAX_FRAME = 960;

function param(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home');
}

/**
 * Website /categories/{slug} (CategoryHub::show): title + tagline, then Tools / Experts /
 * Programmes tabs with counts. Tools is the default tab, as on the website.
 */
export function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = Math.min(width, MAX_FRAME);
  const content = frame - PAD * 2;
  const toolColumns = content >= 600 ? 3 : content >= 280 ? 2 : 1;
  const toolWidth = Math.floor((content - GAP * (toolColumns - 1)) / toolColumns);
  const expertColumns = content >= 720 ? 2 : 1;
  const expertWidth = Math.floor((content - GAP * (expertColumns - 1)) / expertColumns);

  const params = useLocalSearchParams<{ slug?: string; label?: string; tab?: string }>();
  const slug = param(params.slug);
  const label = CATEGORY_LABELS[slug] ?? (param(params.label) || 'Category');
  const tagline = CATEGORY_TAGLINES[slug];
  const [tab, setTab] = useState<CategoryTab>(normaliseTab(param(params.tab)));
  const [refreshing, setRefreshing] = useState(false);

  const catalogue = useToolsCatalogue({ select: selectTools });
  const tools = useMemo(
    () => websiteListed(catalogue.data ?? []).filter((tool) => matchesCategory(tool, slug)),
    [catalogue.data, slug],
  );

  const directory = useExpertsDirectory('', slug);
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = directory;
  const experts = useMemo(() => {
    const seen = new Set<number>();
    return (data?.pages ?? []).flatMap((page) => page.experts).filter((expert) => !seen.has(expert.id) && seen.add(expert.id));
  }, [data]);
  const expertTotal = data?.pages[0]?.meta?.total ?? experts.length;

  const programmes = useCategoryProgrammes(slug);

  const counts: Record<CategoryTab, number | null> = {
    tools: catalogue.data ? tools.length : null,
    experts: data ? expertTotal : null,
    programmes: programmes.data ? programmes.data.length : null,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([catalogue.refetch(), directory.refetch(), programmes.refetch()]);
    setRefreshing(false);
  }, [catalogue, directory, programmes]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  let panel: React.ReactNode;
  if (!EXPERTS_LIVE) {
    panel = (
      <StatePanel
        icon="cloud-offline-outline"
        title="Category unavailable"
        body="The YuktiOne server address is not configured in this build, so this category can't be loaded."
      />
    );
  } else if (tab === 'tools') {
    if (catalogue.isPending) {
      panel = (
        <View style={styles.grid}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} style={{ width: toolWidth, height: toolTileHeight(toolWidth), borderRadius: 20 }} />
          ))}
        </View>
      );
    } else if (catalogue.isError) {
      panel = (
        <StatePanel
          icon="cloud-offline-outline"
          title="We couldn't load tools"
          body="Check your connection and try again."
          primary={{ label: 'Try again', onPress: () => void catalogue.refetch() }}
        />
      );
    } else if (tools.length === 0) {
      panel = (
        <StatePanel
          icon="construct-outline"
          title="No tools yet"
          body="Launchable tools for this category will appear here when published."
          secondary={{ label: 'Browse all tools', onPress: () => router.navigate('/(tabs)/tools') }}
        />
      );
    } else {
      panel = (
        <View style={styles.grid}>
          {tools.map((tool) => (
            <ToolTile key={tool.slug} tool={tool} width={toolWidth} />
          ))}
        </View>
      );
    }
  } else if (tab === 'experts') {
    if (directory.isPending) {
      panel = (
        <View style={styles.list}>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} style={{ width: expertWidth, height: 128, borderRadius: 20 }} />
          ))}
        </View>
      );
    } else if (directory.isError) {
      panel = (
        <StatePanel
          icon="cloud-offline-outline"
          title="We couldn't load experts"
          body="Check your connection and try again."
          primary={{ label: 'Try again', onPress: () => void directory.refetch() }}
        />
      );
    } else if (experts.length === 0) {
      panel = (
        <StatePanel
          icon="people-outline"
          title="No experts yet"
          body="Verified professionals for this category will appear here when available."
          secondary={{ label: 'Browse all experts', onPress: () => router.navigate('/(tabs)/experts') }}
        />
      );
    } else {
      panel = (
        <View style={styles.list}>
          <View style={styles.grid}>
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} width={expertWidth} />
            ))}
          </View>
          {hasNextPage ? (
            isFetchingNextPage ? (
              <ActivityIndicator color={brand.plum} style={styles.more} accessibilityLabel="Loading more experts" />
            ) : (
              <SecondaryButton
                label={`Show more experts (${experts.length} of ${expertTotal})`}
                onPress={() => void fetchNextPage()}
                compact
              />
            )
          ) : null}
        </View>
      );
    }
  } else if (programmes.isPending) {
    panel = <Skeleton style={{ width: content, height: 140, borderRadius: 20 }} />;
  } else if (programmes.isError) {
    panel = (
      <StatePanel
        icon="cloud-offline-outline"
        title="We couldn't load programmes"
        body="Check your connection and try again."
        primary={{ label: 'Try again', onPress: () => void programmes.refetch() }}
      />
    );
  } else if ((programmes.data ?? []).length === 0) {
    panel = (
      <StatePanel
        icon="calendar-outline"
        title="No programmes yet"
        body="Category-linked programmes will appear here when published."
      />
    );
  } else {
    panel = (
      <View style={styles.list}>
        {(programmes.data ?? []).map((event) => (
          <EventCard key={event.id} event={event} width={content} today={today} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 10) }]}
        refreshControl={
          EXPERTS_LIVE ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.plum} /> : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <SpaceBackdrop height={insets.top + 250} />
        <View style={[styles.content, { width: frame }]}>
          <View style={styles.header}>
            <IconButton icon="chevron-back" label="Go back" onPress={goBack} />
            <View style={styles.headerActions}>
              <DiscoverHeaderActions />
            </View>
          </View>
          <SpaceTitle title={label} subtitle={tagline} />

          <View style={styles.tabs} accessibilityRole="tablist">
            {CATEGORY_TABS.map((item) => {
              const on = tab === item.key;
              const count = counts[item.key];
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  aria-selected={on}
                  accessibilityLabel={count === null ? item.label : `${item.label}, ${count}`}
                  onPress={() => setTab(item.key)}
                  style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]}
                >
                  <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {count !== null ? (
                    <Text style={[styles.tabCount, on && styles.tabCountOn]}>{count}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {panel}
        </View>
      </ScrollView>
      <BottomNav preset="discover" active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customer.canvas },
  scroll: { alignItems: 'center', paddingBottom: 28 },
  content: { paddingHorizontal: PAD, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.8 },

  tabs: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 999,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
    ...shadows.sm,
  },
  // Grows from its natural width so the longer "Programmes" label keeps its room on small phones.
  tab: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  tabOn: { backgroundColor: brand.plum },
  tabText: { flexShrink: 1, fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  tabTextOn: { color: brand.white },
  tabCount: {
    fontFamily: customerFonts.semibold,
    fontSize: 11,
    color: brand.plum,
    minWidth: 20,
    textAlign: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: brand.plumSoft,
  },
  tabCountOn: { color: brand.plum, backgroundColor: brand.white },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  list: { gap: GAP, alignItems: 'stretch' },
  more: { paddingVertical: 12 },
});
