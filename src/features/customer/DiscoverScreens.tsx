import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  TOOLS,
  TIPS,
  art,
  categoryBySlug,
  formatInr,
  moodById,
  toIsoDate,
  toolById,
} from '@/features/customer/content';
import { useAccountScope } from '@/features/customer/myspace/accountData';
import {
  AccountGratitude,
  AccountJournal,
  AccountMoodCheckin,
  SignInToSave,
} from '@/features/customer/myspace/AccountTools';
import { EmptyNote, SourceTag } from '@/features/customer/myspace/parts';
import { customerActions, useCustomerState } from '@/features/customer/store';
import {
  ChipRow,
  CustomerPage,
  Heading,
  IconButton,
  OutlineButton,
  SearchField,
  SectionTitle,
  Subtitle,
  TealButton,
  TrendChart,
} from '@/features/customer/ui';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { ToolHeroCard } from '@/features/tools/ToolDetailParts';
import { TOOLS_LIVE, useToolsCatalogue } from '@/features/tools/toolsCatalogue';
import { customer, customerFonts } from '@/theme';

function openTool(id: string): void {
  router.push({ pathname: '/tools/[id]', params: { id } });
}

export function CategoryScreen({ slug }: { slug: string }) {
  const category = categoryBySlug(slug);
  const [tab, setTab] = useState<'all' | 'tools' | 'programmes' | 'experts' | 'articles'>('all');
  if (!category) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <Heading>Category</Heading>
        <Subtitle>That category is not in the catalog.</Subtitle>
        <TealButton label="Back to Explore" onPress={() => router.replace('/(tabs)/explore')} />
      </CustomerPage>
    );
  }
  const tools = TOOLS.filter((tool) => tool.filters.some((item) => category.slug.includes(item) || item === 'wellbeing'));
  const showTools = tab === 'all' || tab === 'tools';
  return (
    <CustomerPage nav="discover" active="explore" onBack={() => router.back()} right={
      <>
        <IconButton icon="bookmark-outline" label="Save category" onPress={() => Alert.alert('Saved on this device', category.title)} />
        <IconButton icon="search" label="Search" onPress={() => router.push('/(tabs)/explore')} />
      </>
    }>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Heading>{category.title}</Heading>
          <Subtitle>{category.summary}</Subtitle>
        </View>
        <Image source={art.splash} style={styles.heroPerson} />
      </View>
      <View style={styles.pills}>
        <Text style={styles.pill}>{category.toolCount} Tools</Text>
        <Text style={styles.pill}>{category.programmeCount} Programmes</Text>
        <Text style={styles.pill}>{category.expertCount} Experts</Text>
      </View>
      <ChipRow
        options={[
          { id: 'all', label: 'All' },
          { id: 'tools', label: 'Tools' },
          { id: 'programmes', label: 'Programmes' },
          { id: 'experts', label: 'Experts' },
          { id: 'articles', label: 'Articles' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {showTools ? (
        <>
          <SectionTitle title="Popular Tools" action="See All" onAction={() => router.push('/(tabs)/tools')} />
          {tools.slice(0, 4).map((tool) => (
            <Pressable key={tool.id} style={styles.listRow} onPress={() => openTool(tool.id)}>
              <View style={[styles.listIcon, { backgroundColor: tool.tint }]}>
                <Ionicons name={tool.icon} size={20} color={tool.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{tool.name}</Text>
                <Text style={styles.listBody}>{tool.blurb}</Text>
              </View>
              <View style={styles.play}>
                <Ionicons name="play" size={14} color={customer.white} />
              </View>
            </Pressable>
          ))}
        </>
      ) : null}
      {tab === 'programmes' || tab === 'all' ? (
        <Pressable style={styles.promo} onPress={() => router.push('/programmes')}>
          <Text style={styles.promoTitle}>Explore Programmes</Text>
          <Text style={styles.promoBody}>Structured, expert-designed journeys for long-term wellbeing.</Text>
          <View style={{ alignSelf: 'flex-start' }}>
            <TealButton label="View Programmes →" onPress={() => router.push('/programmes')} />
          </View>
        </Pressable>
      ) : null}
      {tab === 'experts' ? (
        <TealButton label="Browse experts" onPress={() => router.push('/experts/browse')} />
      ) : null}
      {tab === 'articles' ? (
        <Text style={styles.empty}>Articles will come from the content API. None are published to the app yet.</Text>
      ) : null}
    </CustomerPage>
  );
}

export function MoodResultScreen() {
  const state = useCustomerState();
  const latest = state.moodHistory[state.moodHistory.length - 1];
  const mood = moodById(latest?.mood ?? 'calm');
  const labels = state.moodHistory.slice(-7).map((point) => point.date.slice(8));
  const values = state.moodHistory.slice(-7).map((point) => point.score);
  return (
    <CustomerPage
      onBack={() => router.back()}
      right={
        <>
          <IconButton
            icon="share-social-outline"
            label="Share insight"
            onPress={() => Alert.alert('Share', 'Sharing uses your device share sheet once a report file is available.')}
          />
          <IconButton icon="bookmark-outline" label="Save" onPress={() => customerActions.toggleSavedTool('mood-check-in')} />
        </>
      }
      footer={<TealButton label="Track Again" icon="refresh" onPress={() => router.replace('/(tabs)/home')} />}
    >
      <View style={styles.kickerRow}>
        <View style={styles.kickerPill}>
          <Ionicons name="flower-outline" size={14} color={customer.teal} />
          <Text style={styles.kicker}>Mood Check-in Result</Text>
        </View>
        <Text style={styles.kickerDate}>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <Heading>Your Insights</Heading>
      <Subtitle>Here&apos;s how you&apos;re feeling and what it means for your wellbeing.</Subtitle>
      <View style={styles.insight}>
        <Text style={styles.bigEmoji}>{mood.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Your Current Mood</Text>
          <Text style={styles.insightTitle}>{mood.label === 'Calm' ? 'Calm & Positive' : mood.label}</Text>
          <Text style={styles.score}>Score: {latest?.score ?? mood.score} / 10</Text>
          <Text style={styles.listBody}>{mood.meaning}</Text>
        </View>
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Mood Trend</Text>
        <Text style={styles.kickerDate}>Last 7 Days</Text>
      </View>
      <TrendChart values={values} labels={labels} />
      <View style={styles.noteCard}>
        <Text style={styles.listTitle}>What This Means</Text>
        <Text style={styles.listBody}>{mood.meaning}</Text>
      </View>
      <SectionTitle title="Personalised Suggestions" />
      {[
        ['meditation', 'Try a 5-minute Meditation', 'Keep your calm and focus even stronger.', 'flower-outline', '#F6EEF9', '#7B3F96'],
        ['gratitude', 'Practice Gratitude', "Write 3 things you're thankful for today.", 'leaf-outline', '#F8EAF1', '#8A0F4D'],
        ['better-sleep', 'Maintain a Good Sleep Routine', 'Aim for 7–8 hours of quality sleep tonight.', 'moon-outline', '#F6EEF9', '#7B3F96'],
      ].map(([id, title, body, icon, tint, ink]) => (
        <Pressable key={id} style={styles.listRow} onPress={() => openTool(id!)}>
          <View style={[styles.listIcon, { backgroundColor: tint }]}>
            <Ionicons name={icon as 'flower-outline'} size={20} color={ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle}>{title}</Text>
            <Text style={styles.listBody}>{body}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={customer.muted} />
        </Pressable>
      ))}
    </CustomerPage>
  );
}

/** These save through the website's recorders; offline preview keeps the device-only runners. */
const ACCOUNT_TOOL_IDS = new Set(['mood-check-in', 'journal', 'gratitude']);

const ACCOUNT_TOOL_SLUGS: Record<string, string> = {
  'mood-check-in': 'daily-mood-check-in',
  journal: 'digital-journal',
  gratitude: 'gratitude-journal',
};

export function ToolRunnerScreen({ id }: { id: string }) {
  const tool = toolById(id);
  const state = useCustomerState();
  const accountLive = useAccountScope().enabled;
  const websiteSlug = ACCOUNT_TOOL_SLUGS[id];
  const websiteTool = useToolsCatalogue({
    select: (data) => data.tools.find((item) => item.slug === websiteSlug) ?? null,
    enabled: TOOLS_LIVE && Boolean(websiteSlug),
  }).data;
  const [text, setText] = useState('');
  const [thanks, setThanks] = useState(['', '', '']);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const bmi = useMemo(() => {
    const metres = Number(height) / 100;
    const kilos = Number(weight);
    if (!metres || !kilos || metres <= 0) return null;
    const value = kilos / (metres * metres);
    const label = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy range' : value < 30 ? 'Overweight' : 'Obese range';
    return { value: value.toFixed(1), label };
  }, [height, weight]);

  if (!tool) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <Heading>Tool</Heading>
        <Subtitle>That tool is not in the catalog.</Subtitle>
      </CustomerPage>
    );
  }

  const saved = state.savedToolIds.includes(tool.id);
  const accountTool = !FRONTEND_ONLY && ACCOUNT_TOOL_IDS.has(tool.id);
  const cups = state.waterDate === toIsoDate(new Date()) ? state.waterCups : 0;

  return (
    <CustomerPage
      onBack={() => router.back()}
      right={
        <IconButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          label="Save tool"
          onPress={() => customerActions.toggleSavedTool(tool.id)}
        />
      }
    >
      {accountTool && websiteTool ? (
        <ToolHeroCard tool={websiteTool} />
      ) : (
        <>
          <View style={[styles.tileIcon, { backgroundColor: tool.tint, width: 56, height: 56 }]}>
            <Ionicons name={tool.icon} size={26} color={tool.ink} />
          </View>
          <Heading>{tool.name}</Heading>
          <Subtitle>{tool.blurb}</Subtitle>
          <Text style={[styles.price, tool.price === 'paid' && styles.pricePaid]}>
            {tool.price === 'free' ? 'Free' : 'Paid · payment API not connected'}
          </Text>
        </>
      )}

      {accountTool ? (
        accountLive ? (
          tool.id === 'mood-check-in' ? <AccountMoodCheckin /> : tool.id === 'journal' ? <AccountJournal /> : <AccountGratitude />
        ) : (
          <SignInToSave what={tool.id === 'mood-check-in' ? 'check-in' : tool.id === 'journal' ? 'journal entry' : 'gratitude entry'} />
        )
      ) : null}

      {tool.runner === 'mood' && !accountTool ? (
        <View style={styles.stack}>
          {(['happy', 'calm', 'okay', 'low', 'stressed'] as const).map((moodId) => {
            const mood = moodById(moodId);
            return (
              <Pressable key={moodId} style={styles.listRow} onPress={() => { customerActions.setMood(moodId); router.push('/insights/mood'); }}>
                <Text style={styles.bigEmoji}>{mood.emoji}</Text>
                <Text style={styles.listTitle}>{mood.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {(tool.runner === 'journal' || tool.runner === 'note') && !accountTool ? (
        <View style={styles.stack}>
          <SourceTag kind="device" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write what is on your mind"
            placeholderTextColor={customer.muted}
            multiline
            style={styles.area}
          />
          <TealButton
            label="Save on this device"
            onPress={() => {
              if (text.trim().length < 2) return;
              customerActions.addJournal(tool.id, text.trim());
              setText('');
              Alert.alert('Saved', 'Your note is stored on this device only.');
            }}
          />
          {state.journal.filter((entry) => entry.toolId === tool.id).slice(0, 3).map((entry) => (
            <Text key={entry.id} style={styles.listBody}>{entry.text}</Text>
          ))}
        </View>
      ) : null}

      {tool.runner === 'gratitude' && !accountTool ? (
        <View style={styles.stack}>
          {thanks.map((line, index) => (
            <TextInput
              key={index}
              value={line}
              onChangeText={(value) => setThanks((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))}
              placeholder={`Grateful for ${index + 1}`}
              placeholderTextColor={customer.muted}
              style={styles.line}
            />
          ))}
          <TealButton
            label="Save gratitude"
            onPress={() => {
              const body = thanks.map((line) => line.trim()).filter(Boolean).join('\n');
              if (!body) return;
              customerActions.addJournal(tool.id, body);
              setThanks(['', '', '']);
              Alert.alert('Saved', 'Three lines of gratitude were saved on this device.');
            }}
          />
        </View>
      ) : null}

      {tool.runner === 'goals' ? (
        <View style={styles.stack}>
          {state.goals.map((goal) => (
            <Pressable key={goal.id} style={styles.listRow} onPress={() => customerActions.bumpGoal(goal.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{goal.title}</Text>
                <Text style={styles.listBody}>{goal.done} / {goal.total} days</Text>
              </View>
              <Text style={styles.sectionAction}>+1</Text>
            </Pressable>
          ))}
          <TextInput value={text} onChangeText={setText} placeholder="New goal" placeholderTextColor={customer.muted} style={styles.line} />
          <OutlineButton label="Add goal" onPress={() => { if (text.trim()) { customerActions.addGoal(text.trim()); setText(''); } }} />
        </View>
      ) : null}

      {tool.runner === 'habits' ? (
        <View style={styles.stack}>
          <Text style={styles.listBody}>Mark today&apos;s habit. Paid checkout is not connected, so this tracker stays on the device.</Text>
          <TealButton label="Mark today complete" onPress={() => customerActions.bumpGoal(state.goals[0]?.id ?? 'mindful')} />
        </View>
      ) : null}

      {tool.runner === 'breathe' ? (
        <View style={styles.stack}>
          <Text style={styles.insightTitle}>{Math.floor(seconds / 60)}:{`${seconds % 60}`.padStart(2, '0')}</Text>
          <Text style={styles.listBody}>{seconds % 8 < 4 ? 'Breathe in' : 'Breathe out'}</Text>
          <TealButton label={running ? 'Pause' : 'Start breathing'} onPress={() => setRunning((value) => !value)} />
        </View>
      ) : null}

      {tool.runner === 'bmi' ? (
        <View style={styles.stack}>
          <TextInput value={height} onChangeText={setHeight} placeholder="Height (cm)" keyboardType="decimal-pad" placeholderTextColor={customer.muted} style={styles.line} />
          <TextInput value={weight} onChangeText={setWeight} placeholder="Weight (kg)" keyboardType="decimal-pad" placeholderTextColor={customer.muted} style={styles.line} />
          {bmi ? <Text style={styles.insightTitle}>{bmi.value} · {bmi.label}</Text> : <Text style={styles.listBody}>Enter height and weight to calculate BMI.</Text>}
        </View>
      ) : null}

      {tool.runner === 'water' ? (
        <View style={styles.stack}>
          <Text style={styles.insightTitle}>{cups} / 8 glasses</Text>
          <TealButton label="Add a glass" onPress={() => customerActions.setWaterCups(cups + 1)} />
          <OutlineButton label="Reset today" onPress={() => customerActions.setWaterCups(0)} />
        </View>
      ) : null}

      {tool.runner === 'tips' ? (
        <View style={styles.stack}>
          <Text style={styles.listTitle}>{TIPS[tipIndex] ?? TIPS[0]}</Text>
          <TealButton label="Next tip" onPress={() => setTipIndex((index) => (index + 1) % TIPS.length)} />
        </View>
      ) : null}

      {accountTool ? null : (
        <Text style={styles.muted}>Reference price label only. {tool.price === 'paid' ? formatInr(199) : 'No charge.'}</Text>
      )}
    </CustomerPage>
  );
}

export function MyToolsScreen() {
  const state = useCustomerState();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'mindfulness' | 'growth' | 'health' | 'daily'>('all');
  const saved = TOOLS.filter((tool) => state.savedToolIds.includes(tool.id));
  const tools = saved.filter((tool) => {
    const text = `${tool.name} ${tool.blurb}`.toLowerCase().includes(query.trim().toLowerCase());
    if (!text) return false;
    if (filter === 'mindfulness') return tool.group === 'mind';
    if (filter === 'growth') return tool.filters.includes('career');
    if (filter === 'health') return tool.filters.includes('health');
    if (filter === 'daily') return tool.group === 'daily';
    return true;
  });

  return (
    <CustomerPage
      nav="my-tools"
      active="tools"
      onBack={() => router.back()}
      right={<IconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />}
    >
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Heading>My Tools</Heading>
          <Subtitle>Tools you saved, kept on this device. Tap the bookmark on any tool to add it here.</Subtitle>
        </View>
        <Image source={art.lotus} style={styles.lotus} />
      </View>
      <SearchField value={query} onChangeText={setQuery} placeholder="Search tools (e.g., mood, journal, BMI...)" />
      <ChipRow
        options={[
          { id: 'all', label: 'All Tools', icon: 'grid-outline' },
          { id: 'mindfulness', label: 'Mindfulness', icon: 'flower-outline' },
          { id: 'growth', label: 'Self Growth', icon: 'stats-chart-outline' },
          { id: 'health', label: 'Health', icon: 'heart-outline' },
          { id: 'daily', label: 'Daily Life', icon: 'calendar-outline' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      <SectionTitle title={`Saved tools (${tools.length})`} action="All tools →" onAction={() => router.push('/(tabs)/tools')} />
      {tools.length === 0 ? (
        <EmptyNote
          icon="bookmark-outline"
          title={saved.length ? 'No saved tools match' : 'No saved tools yet'}
          body={
            saved.length
              ? 'Try a different search or filter.'
              : 'Open any tool and tap the bookmark to keep it here for quick access.'
          }
          actionLabel="Browse all tools →"
          onAction={() => router.push('/(tabs)/tools')}
        />
      ) : null}
      <View style={styles.pairGrid}>
        {tools.map((tool) => (
          <Pressable key={tool.id} style={[styles.pair, { backgroundColor: tool.tint }]} onPress={() => openTool(tool.id)}>
            <Ionicons name={tool.icon} size={22} color={tool.ink} />
            <Text style={styles.listTitle}>{tool.name}</Text>
            <Text style={styles.listBody} numberOfLines={2}>{tool.blurb}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.promo} onPress={() => router.push('/progress')}>
        <Text style={styles.promoTitle}>Your Progress</Text>
        <Text style={styles.promoBody}>Mood check-ins, streak, goals and programmes.</Text>
        <OutlineButton label="View Progress" onPress={() => router.push('/progress')} />
      </Pressable>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  lotus: { width: 72, height: 72, borderRadius: 18 },
  heroPerson: { width: 92, height: 92, borderRadius: 18 },
  block: { gap: 10 },
  row: { gap: 10, paddingRight: 8 },
  tile: {
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
    gap: 6,
    minHeight: 168,
  },
  tileFlex: { flex: 1 },
  tileIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.navy },
  tileBlurb: { fontFamily: customerFonts.regular, fontSize: 11, color: customer.body, flex: 1 },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8EAF1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceBadgePaid: { backgroundColor: '#FCE8F1' },
  price: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.free },
  pricePaid: { color: customer.paid },
  empty: { fontFamily: customerFonts.regular, color: customer.muted, fontSize: 14 },
  gridTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryTwo: {
    width: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: customer.mint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F6EEF9',
    borderRadius: 18,
    padding: 10,
  },
  featuredImage: { width: 84, height: 72, borderRadius: 14 },
  featuredTitle: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  featuredBody: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  category: {
    width: '31%',
    flexGrow: 1,
    minHeight: 108,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
  },
  categoryTitle: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.navy, textAlign: 'center' },
  play: { width: 32, height: 32, borderRadius: 16, backgroundColor: customer.teal, alignItems: 'center', justifyContent: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: customer.mint,
    color: customer.tealDark,
    fontFamily: customerFonts.medium,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: customer.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
  },
  listIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  listBody: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body, lineHeight: 18 },
  promo: { backgroundColor: customer.mint, borderRadius: 18, padding: 16, gap: 8 },
  promoTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  promoBody: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body },
  kickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontFamily: customerFonts.bold, color: customer.teal, fontSize: 13 },
  kickerDate: { fontFamily: customerFonts.medium, color: customer.muted, fontSize: 12 },
  insight: { flexDirection: 'row', gap: 12, backgroundColor: customer.mint, borderRadius: 18, padding: 14 },
  bigEmoji: { fontSize: 36 },
  muted: { fontFamily: customerFonts.regular, color: customer.muted, fontSize: 12 },
  insightTitle: { fontFamily: customerFonts.bold, fontSize: 20, color: customer.navy },
  score: {
    alignSelf: 'flex-start',
    marginVertical: 4,
    backgroundColor: customer.teal,
    color: customer.white,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: customerFonts.bold,
    fontSize: 12,
  },
  noteCard: { backgroundColor: '#FFF8FB', borderRadius: 16, padding: 14, gap: 6 },
  stack: { gap: 10 },
  area: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: customerFonts.regular,
    color: customer.navy,
  },
  line: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 12,
    fontFamily: customerFonts.regular,
    color: customer.navy,
  },
  sectionAction: { color: customer.teal, fontFamily: customerFonts.bold },
  pairGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pair: { width: '48%', flexGrow: 1, borderRadius: 18, padding: 12, gap: 6, minHeight: 120 },
});
