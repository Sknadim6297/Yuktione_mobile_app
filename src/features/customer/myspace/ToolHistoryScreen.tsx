import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Eyebrow } from '@/components/brand';
import { useAccountScope, useToolHistory, type HistoryKind } from '@/features/customer/myspace/accountData';
import { RowSkeletons, SpaceEmpty } from '@/features/customer/myspace/SpaceParts';
import { useCustomerState } from '@/features/customer/store';
import { CustomerPage } from '@/features/customer/ui';
import type { GratitudeEntry, JournalEntry, MoodEntry, MoodTone } from '@/services/api/mySpace';
import { openWebsitePath } from '@/services/website/openWebsite';
import type { WebsitePathKey } from '@/constants';
import { brand, customerFonts, shadows } from '@/theme';

type Tab = {
  kind: HistoryKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  empty: string;
  tool: string;
  start: string;
  website: WebsitePathKey;
};

const TABS: [Tab, Tab, Tab] = [
  {
    kind: 'moods',
    label: 'Mood check-ins',
    icon: 'happy-outline',
    empty: 'No mood check-ins yet',
    tool: 'mood-check-in',
    start: 'Check in now',
    website: 'moodHistory',
  },
  {
    kind: 'journal',
    label: 'Journal',
    icon: 'book-outline',
    empty: 'No journal entries yet',
    tool: 'journal',
    start: 'Write an entry',
    website: 'journalHistory',
  },
  {
    kind: 'gratitude',
    label: 'Gratitude',
    icon: 'sunny-outline',
    empty: 'No gratitude entries yet',
    tool: 'gratitude',
    start: 'Add gratitude',
    website: 'gratitudeHistory',
  },
];

const TONE: Record<MoodTone, { bg: string; ink: string }> = {
  positive: { bg: '#E7F5EE', ink: '#23744D' },
  neutral: { bg: brand.lilacSoft, ink: '#5B4A7A' },
  difficult: { bg: '#FDECEF', ink: '#B22742' },
};

function isKind(value: unknown): value is HistoryKind {
  return value === 'moods' || value === 'journal' || value === 'gratitude';
}

function stamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MoodItem({ entry }: { entry: MoodEntry }) {
  return (
    <>
      <Text style={styles.itemTitle}>{entry.mood_label ?? 'Mood check-in'}</Text>
      {entry.emotions.length ? (
        <View style={styles.chips}>
          {entry.emotions.map((emotion) => (
            <View key={emotion.key} style={[styles.chip, { backgroundColor: TONE[emotion.tone]?.bg ?? brand.pearlDeep }]}>
              <Text style={[styles.chipText, { color: TONE[emotion.tone]?.ink ?? brand.grey }]}>{emotion.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {entry.reflection ? <Text style={styles.itemBody}>{entry.reflection}</Text> : null}
      <Text style={styles.itemTime}>{stamp(entry.checked_in_at)}</Text>
    </>
  );
}

function JournalItem({ entry }: { entry: JournalEntry }) {
  return (
    <>
      <Text style={styles.itemTitle}>{entry.title || entry.prompt_label || 'Journal entry'}</Text>
      {entry.title && entry.prompt_label ? <Text style={styles.itemMeta}>{entry.prompt_label}</Text> : null}
      {entry.excerpt ? <Text style={styles.itemBody}>{entry.excerpt}</Text> : null}
      <Text style={styles.itemTime}>{stamp(entry.written_at)}</Text>
    </>
  );
}

function GratitudeItem({ entry }: { entry: GratitudeEntry }) {
  return (
    <>
      <Text style={styles.itemTitle}>Gratitude entry</Text>
      {entry.answers.map((answer) => (
        <View key={answer.key} style={styles.answer}>
          <Text style={styles.itemMeta}>{answer.label}</Text>
          <Text style={styles.itemBody}>{answer.excerpt}</Text>
        </View>
      ))}
      <Text style={styles.itemTime}>{stamp(entry.written_at)}</Text>
    </>
  );
}

export function ToolHistoryScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<HistoryKind>(isKind(params.kind) ? params.kind : 'moods');
  const state = useCustomerState();
  const { enabled } = useAccountScope();
  const query = useToolHistory(kind);
  const tab = TABS.find((item) => item.kind === kind) ?? TABS[0];
  const pages = query.data?.pages ?? [];
  const total = pages[0]?.meta.total;

  if (state.ready && !state.session) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <SpaceEmpty
          icon="lock-closed-outline"
          title="Sign in required"
          body="Sign in with your YuktiOne account to see your saved tool history."
          actionLabel="Sign in"
          onAction={() => router.push('/auth')}
        />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage
      onBack={() => router.back()}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={enabled ? () => void query.refetch() : undefined}
    >
      <View style={styles.intro}>
        <Eyebrow label="Your account" />
        <Text style={styles.title} accessibilityRole="header">Tool history</Text>
        <Text style={styles.lead}>
          Entries saved from the app or the YuktiOne website, newest first. Showing the last 12 months.
        </Text>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((item) => {
          const on = item.kind === kind;
          return (
            <Pressable
              key={item.kind}
              accessibilityRole="tab"
              aria-selected={on}
              onPress={() => setKind(item.kind)}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Ionicons name={item.icon} size={16} color={on ? brand.white : brand.plum} />
              <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {total === undefined ? ' ' : `${total} ${total === 1 ? 'entry' : 'entries'}`}
        </Text>
        <Pressable accessibilityRole="link" onPress={() => void openWebsitePath(tab.website)} hitSlop={8} style={styles.webLink}>
          <Text style={styles.webLinkText}>Full history on website</Text>
          <Ionicons name="open-outline" size={13} color={brand.plum} />
        </Pressable>
      </View>

      {!enabled ? (
        <SpaceEmpty
          icon="cloud-offline-outline"
          title="Not connected to your account"
          body="Tool history loads from your YuktiOne account once the app is connected to the server."
        />
      ) : query.isLoading ? (
        <View style={styles.card}>
          <RowSkeletons count={4} />
        </View>
      ) : query.isError ? (
        <SpaceEmpty
          icon="cloud-offline-outline"
          title="History unavailable"
          body={query.error.message}
          actionLabel="Try again"
          onAction={() => void query.refetch()}
        />
      ) : total === 0 ? (
        <SpaceEmpty
          icon={tab.icon}
          title={tab.empty}
          body="Entries you save in the app or on the website will appear here."
          actionLabel={tab.start}
          onAction={() => router.push({ pathname: '/tools/[id]', params: { id: tab.tool } })}
        />
      ) : (
        <View style={styles.list}>
          {pages.map((page) =>
            page.kind === 'moods'
              ? page.entries.map((entry) => (
                  <View key={`m-${entry.id}`} style={styles.card}><MoodItem entry={entry} /></View>
                ))
              : page.kind === 'journal'
                ? page.entries.map((entry) => (
                    <View key={`j-${entry.id}`} style={styles.card}><JournalItem entry={entry} /></View>
                  ))
                : page.entries.map((entry) => (
                    <View key={`g-${entry.id}`} style={styles.card}><GratitudeItem entry={entry} /></View>
                  )),
          )}
          {query.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}
            >
              {query.isFetchingNextPage ? (
                <ActivityIndicator color={brand.plum} />
              ) : (
                <Text style={styles.moreText}>Load more</Text>
              )}
            </Pressable>
          ) : (
            <Text style={styles.end}>That is everything from the last 12 months.</Text>
          )}
        </View>
      )}
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  intro: { gap: 6 },
  title: { fontFamily: customerFonts.bold, fontSize: 28, lineHeight: 33, letterSpacing: -0.7, color: brand.ink },
  lead: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: brand.grey },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: {
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
  tabOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  tabText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  tabTextOn: { color: brand.white },

  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  count: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  webLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  webLinkText: { fontFamily: customerFonts.bold, fontSize: 12.5, color: brand.plum },

  list: { gap: 10 },
  card: {
    backgroundColor: brand.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: brand.divider,
    padding: 14,
    gap: 6,
    ...shadows.sm,
  },
  itemTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: brand.ink },
  itemMeta: { fontFamily: customerFonts.semibold, fontSize: 12.5, color: brand.plum },
  itemBody: { fontFamily: customerFonts.regular, fontSize: 13.5, lineHeight: 20, color: '#3E3E4A' },
  itemTime: { fontFamily: customerFonts.medium, fontSize: 12, color: brand.grey, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontFamily: customerFonts.semibold, fontSize: 11.5 },
  answer: { gap: 2 },
  more: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: brand.plum,
    backgroundColor: brand.white,
  },
  moreText: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },
  end: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey, textAlign: 'center', paddingVertical: 6 },
});
