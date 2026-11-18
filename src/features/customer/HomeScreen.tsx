import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { formatInr } from '@/features/customer/content';
import { PillButton, SearchEntry, Section, SectionNotice } from '@/features/customer/home/blocks';
import { PressCard, RemoteImage, Skeleton } from '@/features/customer/home/media';
import {
  expertInitials,
  expertTint,
  openLiveTool,
  toolHref,
  toolVisual,
} from '@/features/customer/liveCatalog';
import { useAccountScope, useMyNotifications } from '@/features/customer/myspace/accountData';
import { Avatar, greetingFor, profileImageUrl, useProfileQuery } from '@/features/customer/myspace/parts';
import { useCustomerState } from '@/features/customer/store';
import { CustomerPage, IconButton } from '@/features/customer/ui';
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
import { brand, customer, customerFonts } from '@/theme';

const LIVE = !FRONTEND_ONLY && isApiConfigured();

/** Daily-practice tools first; everything else keeps the website's display order. */
const QUICK_ACCESS_ORDER = [
  'daily-mood-check-in',
  'digital-journal',
  'gratitude-journal',
  'tarot-reflection',
  'career-interest-test',
  'skills-strengths-assessment',
];
const QUICK_ACCESS_COUNT = 6;
const MORE_TOOLS_COUNT = 4;

function openExpert(id: number): void {
  router.push({ pathname: '/experts/profile/[id]', params: { id: String(id) } });
}

function openCategory(category: ApiExpertCategory): void {
  router.push({
    pathname: '/experts/browse',
    params: { category: category.slug, label: category.label },
  });
}

function splitTools(tools: ApiTool[]): { quick: ApiTool[]; more: ApiTool[] } {
  const runnable = tools.filter((tool) => toolHref(tool) !== null);
  const ranked = [
    ...QUICK_ACCESS_ORDER.flatMap((slug) => runnable.filter((tool) => tool.slug === slug)),
    ...runnable.filter((tool) => !QUICK_ACCESS_ORDER.includes(tool.slug)),
  ];
  return {
    quick: ranked.slice(0, QUICK_ACCESS_COUNT),
    more: ranked.slice(QUICK_ACCESS_COUNT, QUICK_ACCESS_COUNT + MORE_TOOLS_COUNT),
  };
}

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(width - 32, 280);
  const session = useCustomerState().session;
  const account = useAccountScope();
  const profile = useProfileQuery(account.enabled);
  const notifications = useMyNotifications(3);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!account.enabled) return;
      void queryClient.refetchQueries({
        queryKey: ['v1', 'my', account.userId, 'notifications'],
        stale: true,
        type: 'active',
      });
    }, [queryClient, account.enabled, account.userId]),
  );

  const tools = useToolsCatalogue({ select: selectTools, enabled: LIVE });

  const experts = useQuery({
    queryKey: ['v1', 'experts', 'featured'],
    queryFn: async () => {
      const result = await fetchExperts({ featured: true, limit: 8 });
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    enabled: LIVE,
  });

  const events = useQuery({
    queryKey: ['v1', 'programme-events', 'homepage'],
    queryFn: async () => {
      const result = await fetchProgrammeEvents({ homepage: true });
      if (!result.ok) throw new Error(result.message);
      return result.events;
    },
    enabled: LIVE,
  });

  const { quick, more } = useMemo(() => splitTools(tools.data ?? []), [tools.data]);
  const categories = useMemo(
    () => (experts.data?.categories ?? []).filter((category) => category.slug && category.label),
    [experts.data],
  );

  const name = profile.data?.name ?? session?.name ?? '';
  const signedIn = Boolean(session && name.trim());
  const unread = notifications.data?.pages[0]?.unread_count ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      tools.refetch(),
      experts.refetch(),
      events.refetch(),
      account.enabled ? notifications.refetch() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [tools, experts, events, notifications, account.enabled]);

  return (
    <CustomerPage
      nav="discover"
      active="home"
      refreshing={refreshing}
      onRefresh={LIVE ? onRefresh : undefined}
      left={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={signedIn ? 'Open My Space' : 'Sign in or open My Space'}
          onPress={() => router.push('/(tabs)/my-space')}
          hitSlop={6}
          style={styles.avatarButton}
        >
          {signedIn ? (
            <Avatar name={name} uri={resolveImageUrl(profileImageUrl(profile.data))} size={36} />
          ) : (
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={18} color={customer.teal} />
            </View>
          )}
        </Pressable>
      }
      right={
        <>
          <IconButton icon="search-outline" label="Search" onPress={() => router.push('/search')} />
          <IconButton
            icon="notifications-outline"
            label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            onPress={() => router.push('/notifications')}
            badge={account.enabled && unread > 0}
          />
        </>
      }
    >
      <Greeting signedIn={signedIn} name={name} />
      <Hero width={contentWidth} />
      <SearchEntry />

      {LIVE ? (
        <Section
          title="Quick access"
          action="All tools"
          onAction={() => router.push('/(tabs)/tools')}
        >
          {tools.isPending ? (
            <SkeletonRow width={120} height={150} />
          ) : tools.isError ? (
            <SectionNotice
              text="We couldn't load tools right now."
              action="Try again"
              onAction={() => void tools.refetch()}
            />
          ) : quick.length > 0 ? (
            <HorizontalList
              data={quick}
              keyExtractor={(tool) => tool.slug}
              renderItem={(tool) => <QuickToolCard tool={tool} />}
            />
          ) : (
            <SectionNotice text="Tools will appear here once they're published." />
          )}
        </Section>
      ) : null}

      <ConsultBanner width={contentWidth} />

      {LIVE ? (
        <Section
          title="Featured experts"
          action="View all"
          onAction={() => router.push('/(tabs)/experts')}
        >
          {experts.isPending ? (
            <SkeletonRow width={184} height={300} />
          ) : experts.isError ? (
            <SectionNotice
              text="We couldn't load experts right now."
              action="Try again"
              onAction={() => void experts.refetch()}
            />
          ) : experts.data.experts.length > 0 ? (
            <HorizontalList
              data={experts.data.experts}
              keyExtractor={(expert) => String(expert.id)}
              renderItem={(expert) => <ExpertCard expert={expert} />}
            />
          ) : (
            <SectionNotice text="Experts will appear here once their profiles are approved." />
          )}
        </Section>
      ) : null}

      {LIVE && (experts.isPending || categories.length > 0) ? (
        <Section title="Explore by need">
          {experts.isPending ? (
            <SkeletonRow width={132} height={170} />
          ) : (
            <HorizontalList
              data={categories}
              keyExtractor={(category) => category.slug}
              renderItem={(category) => <CategoryCard category={category} />}
            />
          )}
        </Section>
      ) : null}

      {LIVE && more.length > 0 ? (
        <Section
          title="Explore our tools"
          action="View all"
          onAction={() => router.push('/(tabs)/tools')}
        >
          <View style={styles.toolList}>
            {more.map((tool, index) => (
              <ToolRow key={tool.slug} tool={tool} first={index === 0} />
            ))}
          </View>
        </Section>
      ) : null}

      {LIVE && (events.data?.length ?? 0) > 0 ? (
        <Section
          title="Programmes"
          action="View all"
          onAction={() => router.push('/programmes')}
        >
          <HorizontalList
            data={events.data ?? []}
            keyExtractor={(event) => String(event.id)}
            renderItem={(event) => <ProgrammeCard event={event} />}
          />
        </Section>
      ) : null}

      <JourneyBanner />

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/professional/join')}
        style={({ pressed }) => [styles.proLink, pressed && styles.pressedText]}
      >
        <Text style={styles.proLinkText}>
          Are you an expert? <Text style={styles.proLinkAction}>Join YuktiOne as a professional</Text>
        </Text>
      </Pressable>
    </CustomerPage>
  );
}

function Greeting({ signedIn, name }: { signedIn: boolean; name: string }) {
  if (signedIn) {
    const first = name.trim().split(/\s+/)[0] ?? '';
    return (
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle} numberOfLines={1}>
          {greetingFor(new Date())}
          {first ? `, ${first}` : ''}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.greeting, styles.greetingRow]}>
      <Text style={styles.greetingTitle}>Welcome to YuktiOne</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/auth')}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressedText}
      >
        <Text style={styles.signIn}>Sign in</Text>
      </Pressable>
    </View>
  );
}

function Hero({ width }: { width: number }) {
  const wide = width >= 600;
  const content = (
    <View style={[styles.heroContent, wide && styles.heroContentWide]}>
      <Text style={styles.heroTitle} accessibilityRole="header">
        Talk. Reflect. Grow.
      </Text>
      <Text style={styles.heroBody}>Expert guidance and personal growth, all in one place.</Text>
      <View style={[styles.heroActions, width < 320 && styles.heroActionsStacked]}>
        <PillButton
          label="Find an Expert"
          onPress={() => router.push('/(tabs)/experts')}
          tone="teal"
          grow
        />
        <PillButton
          label="Explore Tools"
          onPress={() => router.push('/(tabs)/tools')}
          tone="light"
          grow
        />
      </View>
    </View>
  );

  if (wide) {
    return (
      <View style={[styles.hero, styles.heroWide]}>
        {content}
        <RemoteImage
          uri={websiteImage('hero')}
          background={brand.plumDeep}
          fallback={<View />}
          style={styles.heroWideImage}
        />
      </View>
    );
  }

  return (
    <RemoteImage
      uri={websiteImage('hero')}
      background={brand.plumDeep}
      fallback={<View />}
      style={[styles.hero, { height: Math.round(Math.min(Math.max(width * 1.08, 380), 480)) }]}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="heroScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.28" stopColor={brand.plumDeep} stopOpacity="0" />
            <Stop offset="0.62" stopColor={brand.plumDeep} stopOpacity="0.55" />
            <Stop offset="1" stopColor={brand.plumDeep} stopOpacity="0.92" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroScrim)" />
      </Svg>
      {content}
    </RemoteImage>
  );
}

function ConsultBanner({ width }: { width: number }) {
  const wide = width >= 600;
  const imageHeight = wide ? 220 : Math.round(Math.min(width / 1.59, 210));
  return (
    <View style={[styles.consult, wide && styles.consultWide]}>
      <RemoteImage
        uri={websiteImage('experts')}
        resizeMode="contain"
        background={brand.heroCream}
        inset={8}
        style={[styles.consultImage, wide ? styles.consultImageWide : { height: imageHeight }]}
      />
      <View style={[styles.consultBody, wide && styles.consultBodyWide]}>
        <Text style={styles.bannerTitle} accessibilityRole="header">
          Guidance from the Right Expert
        </Text>
        <Text style={styles.bannerBody}>
          Connect with professionals who understand your goals.
        </Text>
        <PillButton
          label="Explore Experts"
          icon="arrow-forward"
          onPress={() => router.push('/(tabs)/experts')}
          tone="teal"
        />
      </View>
    </View>
  );
}

function JourneyBanner() {
  return (
    <RemoteImage uri={websiteImage('ribbon')} background={customer.mint} fallback={<View />} style={styles.journey}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="journeyWash" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={customer.cream} stopOpacity="0.94" />
            <Stop offset="0.55" stopColor={customer.cream} stopOpacity="0.7" />
            <Stop offset="1" stopColor={customer.cream} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#journeyWash)" />
      </Svg>
      <View style={styles.journeyContent}>
        <Text style={styles.bannerTitle} accessibilityRole="header">
          Your Journey, Your Pace
        </Text>
        <Text style={[styles.bannerBody, styles.journeyBody]}>
          Explore tools and guidance designed to support your growth.
        </Text>
        <PillButton
          label="Start Exploring"
          icon="arrow-forward"
          onPress={() => router.push('/(tabs)/explore')}
          tone="teal"
        />
      </View>
    </RemoteImage>
  );
}

function HorizontalList<T>({
  data,
  keyExtractor,
  renderItem,
}: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => <>{renderItem(item)}</>}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={4}
      style={styles.rail}
      contentContainerStyle={styles.railContent}
    />
  );
}

function SkeletonRow({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.rail, styles.railContent, styles.skeletonRow]} accessibilityLabel="Loading">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} style={{ width, height, borderRadius: 18 }} />
      ))}
    </View>
  );
}

const QuickToolCard = memo(function QuickToolCard({ tool }: { tool: ApiTool }) {
  const visual = toolVisual(tool);
  return (
    <PressCard onPress={() => openLiveTool(tool)} label={tool.name} style={styles.quickCard}>
      <RemoteImage
        uri={resolveImageUrl(tool.image_url)}
        resizeMode="contain"
        inset={8}
        background={visual.tint}
        style={styles.quickImage}
      />
      <Text style={styles.quickName} numberOfLines={2}>
        {tool.name}
      </Text>
    </PressCard>
  );
});

const ExpertCard = memo(function ExpertCard({ expert }: { expert: ApiExpert }) {
  const specialty = expert.specialization ?? expert.services[0] ?? null;
  const rated = expert.rating != null && expert.review_count > 0;
  return (
    <PressCard
      onPress={() => openExpert(expert.id)}
      label={`${expert.name}${specialty ? `, ${specialty}` : ''}`}
      hint="Opens the expert's profile"
      style={styles.expertCard}
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
      >
        {expert.verified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={14} color={customer.teal} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </RemoteImage>
      <View style={styles.expertBody}>
        <Text style={styles.expertName} numberOfLines={1}>
          {expert.name}
        </Text>
        {specialty ? (
          <Text style={styles.expertSpecialty} numberOfLines={1}>
            {specialty}
          </Text>
        ) : null}
        {rated || expert.starting_price ? (
          <View style={styles.expertMeta}>
            {rated ? (
              <View style={styles.rating}>
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
        <View style={styles.viewProfile}>
          <Text style={styles.viewProfileText}>View profile</Text>
          <Ionicons name="arrow-forward" size={14} color={customer.teal} />
        </View>
      </View>
    </PressCard>
  );
});

const CategoryCard = memo(function CategoryCard({ category }: { category: ApiExpertCategory }) {
  return (
    <PressCard
      onPress={() => openCategory(category)}
      label={category.label}
      hint="Shows experts for this need"
      style={styles.categoryCard}
    >
      <RemoteImage uri={resolveImageUrl(category.image_url)} style={styles.categoryImage} />
      <Text style={styles.categoryLabel} numberOfLines={2}>
        {category.label}
      </Text>
    </PressCard>
  );
});

const ToolRow = memo(function ToolRow({ tool, first }: { tool: ApiTool; first: boolean }) {
  const visual = toolVisual(tool);
  return (
    <PressCard
      onPress={() => openLiveTool(tool)}
      label={tool.name}
      style={[styles.toolRow, !first && styles.toolRowDivider]}
    >
      <RemoteImage
        uri={resolveImageUrl(tool.image_url)}
        resizeMode="contain"
        inset={6}
        background={visual.tint}
        style={styles.toolImage}
      />
      <View style={styles.toolText}>
        <Text style={styles.toolName} numberOfLines={1}>
          {tool.name}
        </Text>
        {tool.description ? (
          <Text style={styles.toolBlurb} numberOfLines={2}>
            {tool.description}
          </Text>
        ) : null}
        <Text style={[styles.access, tool.access_type === 'paid' && styles.accessPaid]}>
          {tool.access_type === 'paid' ? 'Paid' : 'Free'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={customer.muted} />
    </PressCard>
  );
});

const ProgrammeCard = memo(function ProgrammeCard({ event }: { event: ApiProgrammeEvent }) {
  const date = new Date(event.date);
  const when = Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return (
    <PressCard
      onPress={() => router.push('/programmes')}
      label={event.heading}
      style={styles.programmeCard}
    >
      <RemoteImage uri={resolveImageUrl(event.card_image_url)} style={styles.programmeImage} />
      <View style={styles.programmeBody}>
        <Text style={styles.programmeTitle} numberOfLines={2}>
          {event.heading}
        </Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {[when, event.mini_heading].filter(Boolean).join(' · ')}
        </Text>
        {event.starting_fees ? (
          <Text style={styles.programmeFee}>From {formatInr(event.starting_fees)}</Text>
        ) : null}
      </View>
    </PressCard>
  );
});

const styles = StyleSheet.create({
  avatarButton: { borderRadius: 20 },
  guestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: customer.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { marginTop: 2 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  greetingTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 20,
    color: customer.navy,
    letterSpacing: -0.2,
  },
  signIn: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.teal },
  pressedText: { opacity: 0.7 },

  hero: { borderRadius: 20, justifyContent: 'flex-end' },
  heroWide: {
    height: 380,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: customer.navy,
  },
  heroWideImage: { width: '40%', height: '100%' },
  heroContent: { padding: 20, gap: 8 },
  heroContentWide: { flex: 1, justifyContent: 'center', padding: 32 },
  heroTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: customer.white,
    letterSpacing: -0.6,
  },
  heroBody: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 420,
  },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  heroActionsStacked: { flexDirection: 'column' },

  rail: { marginHorizontal: -16 },
  railContent: { paddingHorizontal: 16, gap: 12 },
  skeletonRow: { flexDirection: 'row', overflow: 'hidden' },

  quickCard: {
    width: 120,
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 8,
  },
  quickImage: { height: 92, borderRadius: 14 },
  quickName: {
    marginTop: 8,
    marginHorizontal: 2,
    minHeight: 34,
    fontFamily: customerFonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: customer.navy,
  },

  consult: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
  },
  consultWide: { flexDirection: 'row-reverse', alignItems: 'stretch' },
  consultImage: { width: '100%' },
  consultImageWide: { width: '46%', minHeight: 220 },
  consultBody: { padding: 20, gap: 8 },
  consultBodyWide: { flex: 1, justifyContent: 'center' },
  bannerTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 21,
    lineHeight: 27,
    color: customer.navy,
    letterSpacing: -0.3,
  },
  bannerBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: customer.body,
    marginBottom: 6,
  },

  expertCard: {
    width: 184,
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
    overflow: 'hidden',
  },
  expertPhoto: { height: 188 },
  initialsWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: customerFonts.bold, fontSize: 40, color: customer.navy, opacity: 0.75 },
  verified: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  verifiedText: { fontFamily: customerFonts.bold, fontSize: 11, color: customer.navy },
  expertBody: { padding: 12, gap: 3 },
  expertName: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  expertSpecialty: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body },
  expertMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.muted },
  viewProfile: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  viewProfileText: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },

  categoryCard: { width: 132, gap: 8 },
  categoryImage: { width: 132, height: 132, borderRadius: 18 },
  categoryLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: customer.navy,
    minHeight: 34,
  },

  toolList: {
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
    paddingHorizontal: 14,
  },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  toolRowDivider: { borderTopWidth: 1, borderTopColor: customer.line },
  toolImage: { width: 64, height: 64, borderRadius: 14 },
  toolText: { flex: 1, gap: 3 },
  toolName: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  toolBlurb: { fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 18, color: customer.body },
  access: { fontFamily: customerFonts.bold, fontSize: 11, color: customer.teal, marginTop: 2 },
  accessPaid: { color: brand.copper },

  programmeCard: {
    width: 260,
    borderRadius: 18,
    backgroundColor: customer.white,
    borderWidth: 1,
    borderColor: customer.line,
    overflow: 'hidden',
  },
  programmeImage: { height: 146 },
  programmeBody: { padding: 12, gap: 4 },
  programmeTitle: { fontFamily: customerFonts.bold, fontSize: 15, lineHeight: 20, color: customer.navy },
  programmeFee: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },

  journey: { marginTop: 10, borderRadius: 20, minHeight: 210, justifyContent: 'center' },
  journeyContent: { padding: 20, gap: 8, maxWidth: 360 },
  journeyBody: { color: customer.navy },

  proLink: { alignItems: 'center', paddingVertical: 12 },
  proLinkText: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.muted, textAlign: 'center' },
  proLinkAction: { fontFamily: customerFonts.bold, color: customer.teal },
});
