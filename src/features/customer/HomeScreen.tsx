import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  CATEGORIES,
  SESSION_TYPES,
  TIPS,
  art,
  formatInr,
  moodById,
  programmeById,
  toIsoDate,
  type MoodId,
} from '@/features/customer/content';
import { mapExpertCard, toolHref, toolVisual } from '@/features/customer/liveCatalog';
import { customerActions, useCustomerState } from '@/features/customer/store';
import {
  CustomerPage,
  IconButton,
  SectionTitle,
  TealButton,
  useMenu,
} from '@/features/customer/ui';
import {
  fetchExperts,
  fetchProgrammeEvents,
  fetchTools,
} from '@/services/api/catalog';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { customer, customerFonts } from '@/theme';

const BANNERS = [
  {
    title: 'A little support goes a long way.',
    body: 'Personalised tools, expert guidance and programmes for your wellbeing.',
    action: 'Explore Programmes',
    href: '/programmes' as const,
    image: art.splash,
  },
  {
    title: 'Talk with someone who gets it.',
    body: 'Verified experts for mental health, career and everyday wellbeing.',
    action: 'Find an Expert',
    href: '/(tabs)/experts' as const,
    image: art.lake,
  },
  {
    title: 'Small practices. Real progress.',
    body: 'Pick up a tool or continue a programme you already started.',
    action: 'Open My Space',
    href: '/(tabs)/my-space' as const,
    image: art.dawn,
  },
  {
    title: 'Build calm one day at a time.',
    body: 'Structured programmes for stress, sleep and everyday balance.',
    action: 'Browse Tools',
    href: '/(tabs)/tools' as const,
    image: art.hills,
  },
];

const QUICK_ACTIONS: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  ink: string;
  href: Href;
}[] = [
  { id: 'mood', label: 'Daily Mood', icon: 'happy-outline', tint: '#E7F8F0', ink: '#1F9D6A', href: '/insights/mood' },
  { id: 'journal', label: 'Journal', icon: 'book-outline', tint: '#F1ECFF', ink: '#6E5BD6', href: '/tools/journal' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline', tint: '#FDECEE', ink: '#E25B8A', href: '/tools/gratitude' },
  { id: 'expert', label: 'Talk to Expert', icon: 'people-outline', tint: '#E8F1FF', ink: '#3D6FE0', href: '/(tabs)/experts' },
  { id: 'progress', label: 'My Progress', icon: 'stats-chart-outline', tint: '#FFF0E4', ink: '#E08A3C', href: '/progress' },
  { id: 'tools', label: 'Explore Tools', icon: 'grid-outline', tint: '#E7F6FB', ink: '#2A9BB5', href: '/(tabs)/tools' },
];

function tipOfDayIndex(): number {
  const day = Math.floor(Date.now() / 86_400_000);
  return day % TIPS.length;
}

export function HomeScreen() {
  const menu = useMenu();
  const state = useCustomerState();
  const { width } = useWindowDimensions();
  const [banner, setBanner] = useState(0);
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();

  const toolsQuery = useQuery({
    queryKey: ['v1', 'tools'],
    queryFn: async () => {
      const result = await fetchTools();
      if (!result.ok) throw new Error(result.message);
      return result.tools;
    },
    enabled: liveEnabled,
    staleTime: 60_000,
  });

  const expertsQuery = useQuery({
    queryKey: ['v1', 'experts', 'featured'],
    queryFn: async () => {
      const result = await fetchExperts({ featured: true, limit: 8 });
      if (!result.ok) throw new Error(result.message);
      return result.experts.map(mapExpertCard);
    },
    enabled: liveEnabled,
    staleTime: 60_000,
  });

  const eventsQuery = useQuery({
    queryKey: ['v1', 'programme-events', 'homepage'],
    queryFn: async () => {
      const result = await fetchProgrammeEvents({ homepage: true });
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    enabled: liveEnabled,
    staleTime: 60_000,
  });

  const today = toIsoDate(new Date());
  const todayMood = state.moodHistory.find((point) => point.date === today);
  const moodSize = Math.max(58, (width - 32 - 20) / 5);
  const slide = BANNERS[banner] ?? BANNERS[0]!;
  const tip = TIPS[tipOfDayIndex()] ?? TIPS[0]!;
  const displayName = state.session?.name?.trim();

  const popularTools = useMemo(() => (toolsQuery.data ?? []).slice(0, 8), [toolsQuery.data]);
  const featuredExperts = useMemo(() => (expertsQuery.data ?? []).slice(0, 3), [expertsQuery.data]);
  const featuredEvents = useMemo(() => eventsQuery.data?.events ?? [], [eventsQuery.data]);

  const continueItems = useMemo(() => {
    const items: { id: string; title: string; detail: string; href: Href }[] = [];
    if (state.journal[0]) {
      items.push({
        id: 'journal',
        title: 'Resume Journal',
        detail: 'Pick up where you left off',
        href: '/tools/journal',
      });
    }
    for (const tool of popularTools.slice(0, 2)) {
      const href = toolHref(tool);
      if (!href) continue;
      items.push({
        id: `tool-${tool.slug}`,
        title: tool.name,
        detail: tool.description,
        href,
      });
    }
    return items.slice(0, 4);
  }, [state.journal, popularTools]);

  const streak = useMemo(() => {
    const dates = new Set(state.moodHistory.map((point) => point.date));
    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (dates.has(toIsoDate(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [state.moodHistory]);

  const toolsCompleted = state.activities.filter((item) =>
    /tool|journal|gratitude|mood|check-in/i.test(item.title),
  ).length;
  const programmeProgress = state.enrollments[0]
    ? Math.round(
        (state.enrollments[0].completedDays.length /
          Math.max(programmeById(state.enrollments[0].programmeId)?.days ?? 7, 1)) *
          100,
      )
    : 0;

  const nextSession = useMemo(() => {
    return state.bookings
      .filter((booking) => booking.status === 'upcoming' && !booking.sample)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
  }, [state.bookings]);

  const nextExpert = nextSession
    ? featuredExperts.find((expert) => expert.id === nextSession.expertId)
    : undefined;
  const nextSessionType = nextSession
    ? SESSION_TYPES.find((item) => item.id === nextSession.sessionType)
    : undefined;

  const chooseMood = (id: MoodId) => {
    customerActions.setMood(id);
    router.push('/insights/mood');
  };

  return (
    <CustomerPage
      nav="discover"
      active="home"
      left={<IconButton icon="menu" label="Open menu" onPress={menu.show} />}
      right={
        <>
          <IconButton
            icon="notifications-outline"
            label="Notifications"
            badge={Boolean(nextSession)}
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <IconButton
            icon="person"
            label="My Space"
            filled
            onPress={() => router.push('/(tabs)/my-space')}
          />
          {menu.menu}
        </>
      }
    >
      {displayName ? (
        <Text style={styles.greeting}>Hi, {displayName}</Text>
      ) : null}
      <Text style={styles.moodPrompt}>How are you feeling today?</Text>

      {/* Daily mood */}
      <View style={styles.moods}>
        {(['happy', 'calm', 'okay', 'low', 'stressed'] as const).map((id) => {
          const mood = moodById(id);
          const selected = todayMood?.mood === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={mood.label}
              accessibilityState={{ selected }}
              onPress={() => chooseMood(id)}
              style={[
                styles.mood,
                {
                  width: moodSize,
                  backgroundColor: mood.tint,
                  borderColor: selected ? mood.ink : 'transparent',
                },
              ]}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {todayMood ? (
        <Pressable onPress={() => router.push('/insights/mood')} style={styles.moodSaved}>
          <Text style={styles.moodSavedText}>
            Today&apos;s mood: {moodById(todayMood.mood).label} · View insights
          </Text>
        </Pressable>
      ) : null}

      {/* 3. Hero banner */}
      <ImageBackground source={slide.image} style={styles.banner} imageStyle={styles.bannerImage}>
        <View style={styles.bannerShade} />
        <Text style={styles.bannerTitle}>{slide.title}</Text>
        <Text style={styles.bannerBody}>{slide.body}</Text>
        <View style={styles.bannerButton}>
          <TealButton
            label={slide.action}
            icon="arrow-forward"
            iconPosition="end"
            onPress={() => router.push(slide.href)}
          />
        </View>
      </ImageBackground>
      <View style={styles.dots}>
        {BANNERS.map((item, index) => (
          <Pressable
            key={item.title}
            onPress={() => setBanner(index)}
            accessibilityLabel={`Banner ${index + 1}`}
          >
            <View style={[styles.dot, index === banner && styles.dotOn]} />
          </Pressable>
        ))}
      </View>

      {/* 4. Quick actions */}
      <SectionTitle title="Quick Actions" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={[styles.quickCard, { backgroundColor: action.tint }]}
            onPress={() => router.push(action.href)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={22} color={action.ink} />
            <Text style={[styles.quickLabel, { color: action.ink }]}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 5. Explore by category */}
      <SectionTitle title="Explore" action="View All" onAction={() => router.push('/(tabs)/explore')} />
      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.slug}
            style={[styles.category, { backgroundColor: category.tint }]}
            onPress={() =>
              router.push({ pathname: '/categories/[slug]', params: { slug: category.slug } })
            }
          >
            <Ionicons name={category.icon} size={28} color={category.ink} />
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </Pressable>
        ))}
      </View>

      {/* 6. Popular tools */}
      <SectionTitle
        title="Popular Tools"
        action="View All"
        onAction={() => router.push('/(tabs)/tools')}
      />
      {toolsQuery.isLoading ? <ActivityIndicator color={customer.teal} /> : null}
      {toolsQuery.isError ? (
        <Text style={styles.liveEmpty}>Tools could not be loaded. Pull to retry from Tools.</Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {popularTools.map((tool) => {
          const visual = toolVisual(tool);
          const href = toolHref(tool) ?? {
            pathname: '/tools/[id]' as const,
            params: { id: tool.slug },
          };
          return (
            <Pressable
              key={tool.slug}
              style={styles.toolCard}
              onPress={() => router.push(href)}
            >
              <View style={[styles.toolIcon, { backgroundColor: visual.tint }]}>
                <Ionicons name={visual.icon} size={22} color={visual.ink} />
              </View>
              <Text style={styles.toolName} numberOfLines={2}>
                {tool.name}
              </Text>
              <Text style={styles.toolMeta}>
                {tool.access_type === 'free' ? 'Free' : 'Paid'}
                {!tool.mobile_ready ? ' · Web' : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {!toolsQuery.isLoading && popularTools.length === 0 ? (
        <Text style={styles.liveEmpty}>No active tools are published yet.</Text>
      ) : null}

      {/* 8. Featured experts */}
      <SectionTitle
        title="Featured Experts"
        action="View All"
        onAction={() => router.push('/(tabs)/experts')}
      />
      {expertsQuery.isLoading ? <ActivityIndicator color={customer.teal} /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {featuredExperts.map((expert) => (
          <View key={expert.id} style={styles.expertCard}>
            <View style={[styles.avatar, { backgroundColor: expert.tint }]}>
              <Text style={styles.avatarText}>{expert.initials}</Text>
            </View>
            <Text style={styles.expertName} numberOfLines={1}>
              {expert.name}
            </Text>
            <Text style={styles.expertMeta} numberOfLines={1}>
              {expert.title}
            </Text>
            <Text style={styles.expertMeta}>
              {expert.rating > 0 ? `★ ${expert.rating.toFixed(1)} · ` : ''}
              {expert.specialty}
            </Text>
            <View style={styles.expertActions}>
              <Pressable
                style={styles.ghostBtn}
                onPress={() =>
                  router.push({ pathname: '/experts/profile/[id]', params: { id: expert.id } })
                }
              >
                <Text style={styles.ghostBtnText}>Profile</Text>
              </Pressable>
              <Pressable
                style={styles.solidBtn}
                onPress={() =>
                  router.push({
                    pathname: '/booking/[expertId]',
                    params: { expertId: expert.id },
                  })
                }
              >
                <Text style={styles.solidBtnText}>Book</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      {!expertsQuery.isLoading && featuredExperts.length === 0 ? (
        <Text style={styles.liveEmpty}>No featured experts are available right now.</Text>
      ) : null}

      {/* 9. Website programme events (all_events) — not day-based enrolment */}
      <SectionTitle
        title="Featured Events"
        action="Explore"
        onAction={() => router.push('/programmes')}
      />
      {eventsQuery.isLoading ? <ActivityIndicator color={customer.teal} /> : null}
      {featuredEvents.map((event) => (
        <View key={event.id} style={styles.programmeCard}>
          <View style={styles.programmeCopy}>
            <Text style={styles.recommendTitle}>{event.heading}</Text>
            <Text style={styles.recommendBody}>
              {event.mini_heading}
              {event.date ? ` · ${event.date}` : ''}
              {event.starting_fees != null ? ` · ₹${event.starting_fees}` : ''}
            </Text>
            <Text style={styles.recommendBody} numberOfLines={2}>
              {event.short_description}
            </Text>
            <Text style={styles.sessionNote}>{event.mobile_note}</Text>
          </View>
        </View>
      ))}
      {!eventsQuery.isLoading && featuredEvents.length === 0 ? (
        <Text style={styles.liveEmpty}>
          No website events are published for the homepage yet. Day-based programme enrolment is
          not available in the database.
        </Text>
      ) : null}

      {/* 10. Continue your journey */}
      {continueItems.length > 0 ? (
        <>
          <SectionTitle title="Continue Your Journey" />
          {continueItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.continueRow}
              onPress={() => router.push(item.href)}
            >
              <View style={styles.continueIcon}>
                <Ionicons name="play-circle-outline" size={22} color={customer.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendTitle}>{item.title}</Text>
                <Text style={styles.recommendBody}>{item.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={customer.muted} />
            </Pressable>
          ))}
        </>
      ) : null}

      {/* 11. Progress snapshot */}
      <SectionTitle
        title="Your Progress"
        action="View Progress"
        onAction={() => router.push('/progress')}
      />
      <View style={styles.statsRow}>
        <View style={[styles.stat, { backgroundColor: customer.mint }]}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: customer.lilac }]}>
          <Text style={styles.statValue}>{toolsCompleted || state.savedToolIds.length}</Text>
          <Text style={styles.statLabel}>Tools used</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: customer.peach }]}>
          <Text style={styles.statValue}>{state.moodHistory.length}</Text>
          <Text style={styles.statLabel}>Mood logs</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: customer.sky }]}>
          <Text style={styles.statValue}>{programmeProgress}%</Text>
          <Text style={styles.statLabel}>Programme</Text>
        </View>
      </View>

      {/* 12. Daily tip */}
      <SectionTitle title="Daily Wellness Tip" />
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={22} color={customer.teal} />
        <Text style={styles.tipText}>{tip}</Text>
      </View>

      {/* 13. Upcoming session — never present sample as paid/confirmed */}
      {nextSession && nextExpert ? (
        <>
          <SectionTitle
            title="Upcoming Session"
            action="View Booking"
            onAction={() => router.push('/(tabs)/bookings')}
          />
          <Pressable style={styles.sessionCard} onPress={() => router.push('/(tabs)/bookings')}>
            <View style={[styles.avatar, { backgroundColor: nextExpert.tint }]}>
              <Text style={styles.avatarText}>{nextExpert.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recommendTitle}>{nextExpert.name}</Text>
              <Text style={styles.recommendBody}>
                {nextSession.date} · {nextSession.time}
                {nextSessionType ? ` · ${nextSessionType.title}` : ''}
              </Text>
              <Text style={styles.sessionNote}>
                {nextSession.sample
                  ? 'Sample schedule preview — not a paid booking'
                  : nextSession.payment === 'paid'
                    ? `Confirmed · ${formatInr(nextSession.fee)}`
                    : nextSession.paymentMessage || 'Payment pending'}
              </Text>
            </View>
          </Pressable>
        </>
      ) : null}

      {/* 14. Articles skipped — no published content in app yet */}

      {/* 15. Join as professional */}
      <View style={styles.proCard}>
        <Text style={styles.proTitle}>Become a YuktiOne Professional</Text>
        <Text style={styles.proBody}>
          Share your expertise with people seeking practical, trusted guidance.
        </Text>
        <TealButton
          label="Apply Now"
          icon="arrow-forward"
          iconPosition="end"
          onPress={() => router.push('/professional/join')}
        />
      </View>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontFamily: customerFonts.medium,
    fontSize: 14,
    color: customer.body,
    marginBottom: -4,
  },
  moodPrompt: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: customer.navy,
  },
  liveEmpty: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: customer.muted,
    lineHeight: 18,
  },
  moods: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  mood: {
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 2,
    gap: 4,
  },
  emoji: { fontSize: 22 },
  moodLabel: { fontFamily: customerFonts.medium, fontSize: 11, color: customer.navy },
  moodSaved: {
    alignSelf: 'flex-start',
    backgroundColor: customer.mint,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moodSavedText: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: customer.tealDark,
  },
  banner: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 190,
    padding: 16,
    justifyContent: 'flex-end',
  },
  bannerImage: { borderRadius: 22 },
  bannerShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16, 40, 48, 0.32)' },
  bannerTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 22,
    color: customer.white,
    maxWidth: 250,
  },
  bannerBody: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: customer.white,
    marginVertical: 8,
    maxWidth: 250,
    lineHeight: 18,
  },
  bannerButton: { alignSelf: 'flex-start', minWidth: 180 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D5DEE3' },
  dotOn: { backgroundColor: customer.teal, width: 8, height: 8 },
  hRow: { gap: 10, paddingRight: 8 },
  quickCard: {
    width: 108,
    minHeight: 88,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  category: {
    width: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  categoryTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: customer.navy,
    textAlign: 'center',
  },
  toolCard: {
    width: 132,
    backgroundColor: customer.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
    gap: 8,
  },
  toolIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolName: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.navy },
  toolMeta: { fontFamily: customerFonts.medium, fontSize: 11, color: customer.muted },
  recommendKicker: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: customer.muted,
    marginTop: -4,
  },
  recommend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 10,
  },
  recommendImage: { width: 74, height: 74 },
  recommendImageRadius: { borderRadius: 14 },
  recommendCopy: { flex: 1, gap: 4 },
  recommendTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  recommendBody: { fontFamily: customerFonts.regular, fontSize: 12, color: customer.body },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertCard: {
    width: 196,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 14,
    gap: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontFamily: customerFonts.bold, color: customer.navy, fontSize: 14 },
  expertName: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  expertMeta: { fontFamily: customerFonts.regular, fontSize: 12, color: customer.body },
  expertActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ghostBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.teal },
  solidBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.white },
  programmeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 10,
  },
  programmeImage: { width: 64, height: 64 },
  programmeCopy: { flex: 1, gap: 2 },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: customer.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: customer.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  statValue: { fontFamily: customerFonts.bold, fontSize: 22, color: customer.navy },
  statLabel: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.body },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: customer.mint,
    borderRadius: 16,
    padding: 14,
  },
  tipText: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.navy,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
  },
  sessionNote: {
    fontFamily: customerFonts.medium,
    fontSize: 11,
    color: customer.peachInk,
    marginTop: 4,
  },
  proCard: {
    backgroundColor: customer.navy,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  proTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 18,
    color: customer.white,
  },
  proBody: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 4,
  },
});
