import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  PROGRAMMES,
  formatInr,
  programmeById,
  type Programme,
} from '@/features/customer/content';
import { customerActions, useCustomerState } from '@/features/customer/store';
import {
  ChipRow,
  CustomerPage,
  Heading,
  IconButton,
  SearchField,
  SectionTitle,
  Subtitle,
  TealButton,
} from '@/features/customer/ui';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { fetchProgrammeEvents } from '@/services/api/catalog';
import { customer, customerFonts } from '@/theme';

function ProgrammeRow({ programme, saved }: { programme: Programme; saved: boolean }) {
  return (
    <Pressable style={styles.row} onPress={() => router.push({ pathname: '/programmes/[id]', params: { id: programme.id } })}>
      <Image source={programme.image} style={styles.thumb} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.title}>{programme.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{programme.summary}</Text>
        <Text style={styles.meta}>{programme.days} Days · {programme.level}</Text>
      </View>
      <View style={styles.side}>
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={customer.teal} />
        <Text style={styles.price}>{formatInr(programme.price)}</Text>
      </View>
    </Pressable>
  );
}

export function ProgrammesScreen() {
  const state = useCustomerState();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'mindfulness' | 'career' | 'relationships' | 'lifestyle'>('all');
  const [sort, setSort] = useState<'popular' | 'price' | 'days'>('popular');
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();
  const eventsQuery = useQuery({
    queryKey: ['v1', 'programme-events'],
    queryFn: async () => {
      const result = await fetchProgrammeEvents();
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    enabled: liveEnabled,
  });
  const events = (eventsQuery.data?.events ?? []).filter((event) => {
    if (!query.trim()) return true;
    const haystack = `${event.heading} ${event.mini_heading} ${event.short_description}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const items = PROGRAMMES.filter((programme) => {
    const text = `${programme.title} ${programme.summary}`.toLowerCase().includes(query.trim().toLowerCase());
    const category = filter === 'all' || programme.category === filter;
    return text && category;
  }).sort((a, b) => {
    if (sort === 'price') return a.price - b.price;
    if (sort === 'days') return a.days - b.days;
    return Number(b.popular) - Number(a.popular);
  });
  const featured = items.find((item) => item.popular) ?? items[0];

  return (
    <CustomerPage
      nav="programmes"
      active="programmes"
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="heart-outline" label="Saved programmes" onPress={() => router.push('/(tabs)/my-space')} />
          <IconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/(tabs)/bookings')} />
        </>
      }
    >
      <Heading>Programmes</Heading>
      <Subtitle>Website events from YuktiOne. Day-based programme enrolment is not stored in MySQL yet.</Subtitle>
      <SearchField value={query} onChangeText={setQuery} placeholder="Search programmes (e.g., stress, career, mindfulness)" />
      {eventsQuery.isLoading ? <ActivityIndicator color={customer.teal} /> : null}
      <SectionTitle title="Website Events" />
      {events.map((event) => (
        <View key={event.id} style={styles.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title}>{event.heading}</Text>
            <Text style={styles.body} numberOfLines={2}>{event.short_description}</Text>
            <Text style={styles.meta}>
              {event.mini_heading}
              {event.date ? ` · ${event.date}` : ''}
              {event.starting_fees != null ? ` · ${formatInr(event.starting_fees)}` : ''}
            </Text>
            <Text style={styles.meta}>{event.mobile_note}</Text>
          </View>
        </View>
      ))}
      {!eventsQuery.isLoading && events.length === 0 ? (
        <Text style={styles.meta}>No approved website events are published.</Text>
      ) : null}
      <ChipRow
        options={[
          { id: 'all', label: 'All', icon: 'grid-outline' },
          { id: 'mindfulness', label: 'Mindfulness', icon: 'flower-outline' },
          { id: 'career', label: 'Career', icon: 'briefcase-outline' },
          { id: 'relationships', label: 'Relationships', icon: 'heart-outline' },
          { id: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Text style={styles.meta}>
        Local design catalogue below is not website enrolment data and is hidden from Home featured sections.
      </Text>
      {featured ? (
        <>
          <SectionTitle title="Featured Programmes" action="See All →" onAction={() => setFilter('all')} />
          <Pressable onPress={() => router.push({ pathname: '/programmes/[id]', params: { id: featured.id } })}>
            <Image source={featured.image} style={styles.hero} />
            <View style={styles.heroCopy}>
              {featured.popular ? <Text style={styles.badge}>Most Popular</Text> : null}
              <Text style={styles.heroTitle}>{featured.title}</Text>
              <Text style={styles.heroBody}>{featured.summary}</Text>
              <Text style={styles.heroMeta}>{featured.days} Days · {featured.level}</Text>
            </View>
          </Pressable>
        </>
      ) : null}
      <SectionTitle
        title={`All Programmes (${items.length})`}
        action={`Sort: ${sort}`}
        onAction={() => setSort(sort === 'popular' ? 'price' : sort === 'price' ? 'days' : 'popular')}
      />
      {items.map((programme) => (
        <ProgrammeRow
          key={programme.id}
          programme={programme}
          saved={state.savedProgrammeIds.includes(programme.id)}
        />
      ))}
      {items.length === 0 ? <Text style={styles.meta}>No programmes match that search.</Text> : null}
    </CustomerPage>
  );
}

export function ProgrammeDetailScreen({ id }: { id: string }) {
  const programme = programmeById(id);
  const state = useCustomerState();
  const [tab, setTab] = useState<'overview' | 'plan' | 'includes' | 'reviews'>('overview');
  if (!programme) {
    return <CustomerPage onBack={() => router.back()}><Heading>Programme</Heading><Subtitle>Not found.</Subtitle></CustomerPage>;
  }
  const saved = state.savedProgrammeIds.includes(programme.id);
  const enrolled = state.enrollments.some((item) => item.programmeId === programme.id);
  const savePercent = Math.round((1 - programme.price / programme.compareAt) * 100);
  return (
    <CustomerPage
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon={saved ? 'heart' : 'heart-outline'} label="Save programme" onPress={() => customerActions.toggleSavedProgramme(programme.id)} />
          <IconButton icon="notifications-outline" label="Reminders" onPress={() => Alert.alert('Reminders', 'Programme reminders need the notification API.')} />
        </>
      }
      footer={
        <View style={styles.buyRow}>
          <View>
            <Text style={styles.price}>{formatInr(programme.price)}</Text>
            <Text style={styles.compare}>{formatInr(programme.compareAt)} · Save {savePercent}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <TealButton
              label={enrolled ? 'Continue' : 'Enroll Now'}
              icon="cart-outline"
              onPress={() => {
                customerActions.enroll(programme.id);
                router.push({ pathname: '/programmes/[id]/learn', params: { id: programme.id } });
              }}
            />
          </View>
        </View>
      }
    >
      <Image source={programme.image} style={styles.hero} />
      {programme.popular ? <Text style={styles.badge}>Most Popular</Text> : null}
      <Heading>{programme.title}</Heading>
      <Subtitle>{programme.summary}</Subtitle>
      <Text style={styles.meta}>{programme.days} Days · {programme.level} · {programme.enrolledLabel}</Text>
      <ChipRow
        options={[
          { id: 'overview', label: 'Overview' },
          { id: 'plan', label: 'Daily Plan' },
          { id: 'includes', label: "What You'll Get" },
          { id: 'reviews', label: 'Reviews' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'overview' ? (
        <>
          <Text style={styles.section}>About This Programme</Text>
          <Text style={styles.body}>{programme.summary} A short, guided journey you can do in a few minutes a day.</Text>
          <View style={styles.outcomes}>
            {programme.outcomes.map((item) => (
              <View key={item.label} style={styles.outcome}>
                <Ionicons name={item.icon} size={18} color={customer.teal} />
                <Text style={styles.outcomeText}>{item.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.section}>Programme Details</Text>
          <View style={styles.outcomes}>
            <Text style={styles.meta}>Duration {programme.days} Days</Text>
            <Text style={styles.meta}>Level {programme.level}</Text>
            <Text style={styles.meta}>Daily Time 10–15 mins</Text>
            <Text style={styles.meta}>Format Self-paced</Text>
          </View>
        </>
      ) : null}
      {tab === 'plan' || tab === 'overview' ? (
        <>
          <SectionTitle title={`Daily Plan (${programme.plan.length} shown)`} action="View Full Plan →" onAction={() => setTab('plan')} />
          <View style={styles.plan}>
            {programme.plan.slice(0, tab === 'plan' ? programme.plan.length : 7).map((day) => (
              <View key={day.day} style={styles.day}>
                <Ionicons name={day.icon} size={16} color={customer.teal} />
                <Text style={styles.dayLabel}>Day {day.day}</Text>
                <Text style={styles.dayTitle}>{day.title}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {tab === 'includes' || tab === 'overview' ? (
        <>
          <Text style={styles.section}>What You&apos;ll Get</Text>
          {programme.includes.map((item) => (
            <Text key={item} style={styles.body}>✓ {item}</Text>
          ))}
          <Text style={styles.meta}>Enrollment on this device does not collect the listed price. Payment is still not connected.</Text>
        </>
      ) : null}
      {tab === 'reviews' ? (
        <Text style={styles.body}>Written programme reviews are not in the catalog yet. Expert reviews live on expert profiles.</Text>
      ) : null}
    </CustomerPage>
  );
}

export function ProgrammeLearnScreen({ id }: { id: string }) {
  const programme = programmeById(id);
  const state = useCustomerState();
  const enrollment = state.enrollments.find((item) => item.programmeId === id);
  const [tab, setTab] = useState<'content' | 'progress' | 'resources' | 'community'>('content');
  if (!programme) {
    return <CustomerPage onBack={() => router.back()}><Heading>Programme</Heading><Subtitle>Not found.</Subtitle></CustomerPage>;
  }
  const completed = enrollment?.completedDays ?? [];
  const percent = Math.round((completed.length / Math.max(programme.plan.length, 1)) * 100);
  const nextDay = programme.plan.find((day) => !completed.includes(day.day))?.day;
  return (
    <CustomerPage
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="bookmark-outline" label="Save" onPress={() => customerActions.toggleSavedProgramme(programme.id)} />
          <IconButton icon="share-social-outline" label="Share" onPress={() => Alert.alert(programme.title, 'Share the programme once a public link exists.')} />
        </>
      }
    >
      <Image source={programme.image} style={styles.hero} />
      <Text style={styles.badge}>{enrollment ? 'Enrolled on this device' : 'Preview'}</Text>
      <Heading>{programme.title}</Heading>
      <Subtitle>{programme.summary}</Subtitle>
      <Text style={styles.meta}>{programme.days} Days · {programme.level} · 10–15 mins/day</Text>
      {enrollment?.payment === 'not_collected' ? (
        <Text style={styles.meta}>Payment was not collected. Progress below is stored only on this device.</Text>
      ) : null}
      <ChipRow
        options={[
          { id: 'content', label: 'Content', icon: 'list-outline' },
          { id: 'progress', label: 'Progress', icon: 'stats-chart-outline' },
          { id: 'resources', label: 'Resources', icon: 'folder-outline' },
          { id: 'community', label: 'Community', icon: 'people-outline' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'content' ? (
        <>
          <SectionTitle title="Programme Content" action={`${percent}% Complete`} />
          {programme.plan.map((day) => {
            const done = completed.includes(day.day);
            const locked = nextDay !== undefined && day.day > nextDay;
            return (
              <View key={day.day} style={[styles.lesson, done && styles.lessonDone]}>
                <Image source={programme.image} style={styles.lessonArt} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.meta}>Day {day.day}</Text>
                  <Text style={styles.title}>{day.title}</Text>
                  <Text style={styles.body}>{day.summary}</Text>
                  <Text style={styles.meta}>{day.minutes} mins · {day.format}</Text>
                </View>
                {locked ? (
                  <Ionicons name="lock-closed-outline" size={18} color={customer.muted} />
                ) : (
                  <Pressable
                    style={styles.start}
                    onPress={() => {
                      if (!enrollment) customerActions.enroll(programme.id);
                      customerActions.completeDay(programme.id, day.day);
                      Alert.alert(day.title, 'Marked complete on this device. Audio streaming is not connected yet.');
                    }}
                  >
                    <Text style={styles.startText}>{done ? 'Done' : 'Start'}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          <View style={styles.certificate}>
            <Text style={styles.title}>Complete the Programme</Text>
            <Text style={styles.body}>Finish every day to get a completion note on this device. A certificate file is not issued until the programme API exists.</Text>
          </View>
        </>
      ) : null}
      {tab === 'progress' ? <Text style={styles.body}>{completed.length} of {programme.plan.length} days complete ({percent}%).</Text> : null}
      {tab === 'resources' ? <Text style={styles.body}>The downloadable tracker PDF is listed in the programme, but the file host is not connected.</Text> : null}
      {tab === 'community' ? <Text style={styles.body}>Community discussion is not available in this build.</Text> : null}
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: customer.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 10,
    alignItems: 'center',
  },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  title: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  body: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body, lineHeight: 18 },
  meta: { fontFamily: customerFonts.regular, fontSize: 12, color: customer.muted },
  side: { alignItems: 'flex-end', gap: 8 },
  price: { fontFamily: customerFonts.bold, color: customer.teal, fontSize: 16 },
  hero: { width: '100%', height: 180, borderRadius: 18 },
  heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 28, gap: 4 },
  heroTitle: { fontFamily: customerFonts.bold, fontSize: 22, color: customer.white },
  heroBody: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.white },
  heroMeta: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.white },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F6C445',
    color: customer.navy,
    fontFamily: customerFonts.bold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  section: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  outcomes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outcome: { width: '48%', backgroundColor: customer.mint, borderRadius: 16, padding: 12, gap: 6 },
  outcomeText: { fontFamily: customerFonts.medium, color: customer.navy, fontSize: 13 },
  plan: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { width: '30%', flexGrow: 1, backgroundColor: customer.white, borderRadius: 14, borderWidth: 1, borderColor: customer.line, padding: 8, gap: 4 },
  dayLabel: { fontFamily: customerFonts.medium, fontSize: 11, color: customer.teal },
  dayTitle: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.navy },
  compare: { fontFamily: customerFonts.regular, color: customer.muted, fontSize: 12 },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lesson: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: customer.white, borderRadius: 16, borderWidth: 1, borderColor: customer.line, padding: 10 },
  lessonDone: { borderColor: customer.teal, backgroundColor: customer.mint },
  lessonArt: { width: 64, height: 64, borderRadius: 12 },
  start: { backgroundColor: customer.teal, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  startText: { color: customer.white, fontFamily: customerFonts.bold, fontSize: 12 },
  certificate: { backgroundColor: customer.mint, borderRadius: 16, padding: 14, gap: 6 },
});
