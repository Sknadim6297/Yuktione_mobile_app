import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { MOODS, art, formatWeekdayDate, programmeById, toIsoDate } from '@/features/customer/content';
import {
  formatStamp,
  useAccountScope,
  useActivitySummary,
  useRecentEntries,
  type RangeDays,
} from '@/features/customer/myspace/accountData';
import { Card, EmptyNote, StatTile, myspace } from '@/features/customer/myspace/parts';
import { useCustomerState, type MoodPoint } from '@/features/customer/store';
import {
  ChipRow,
  CustomerPage,
  DonutChart,
  Heading,
  IconButton,
  Subtitle,
  TrendChart,
} from '@/features/customer/ui';
import type { ActivitySummary, MoodTone } from '@/services/api/mySpace';
import { openWebsitePath } from '@/services/website/openWebsite';
import { customer, customerFonts } from '@/theme';

type Range = '7' | '30' | '90';

const RANGE_OPTIONS: { id: Range; label: string }[] = [
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: '90', label: '90 Days' },
];

/** Colours for the website's mood keys (MoodCheckin::options()). */
const ACCOUNT_MOOD_COLORS: Record<string, string> = {
  'very-happy': customer.greenInk,
  good: customer.teal,
  neutral: customer.goldInk,
  sad: customer.blueInk,
  stressed: customer.pinkInk,
};

const TONE_COLORS: Record<MoodTone, string> = {
  positive: customer.greenInk,
  neutral: customer.goldInk,
  difficult: customer.pinkInk,
};

function inRange(history: MoodPoint[], range: Range): MoodPoint[] {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (Number(range) - 1));
  const from = toIsoDate(cutoff);
  return history.filter((point) => point.date >= from);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

const notificationsButton = (
  <IconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
);

function useAccountSummary(range: Range) {
  const { enabled } = useAccountScope();
  const days = Number(range) as RangeDays;
  return { enabled, days, query: useActivitySummary(days) };
}

function AccountUnavailable({ loading, error, onRetry }: { loading: boolean; error?: Error | null; onRetry: () => void }) {
  if (loading) return <ActivityIndicator color={customer.teal} />;
  if (error) {
    return (
      <EmptyNote
        icon="cloud-offline-outline"
        title="Could not load your account activity"
        body={error.message}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }
  return (
    <EmptyNote
      icon="cloud-offline-outline"
      title="Not connected to your account"
      body="Sign in to the YuktiOne server to see the activity saved on your account."
    />
  );
}

function AccountStats({ summary }: { summary: ActivitySummary }) {
  return (
    <View style={myspace.grid}>
      <StatTile icon="happy-outline" value={String(summary.mood.count)} label="Mood check-ins" tint={customer.green} ink={customer.greenInk} />
      <StatTile icon="calendar-outline" value={plural(summary.mood.active_days, 'day')} label="With a mood check-in" tint={customer.sky} ink={customer.skyInk} />
      <StatTile icon="book-outline" value={String(summary.journal.count)} label="Journal entries" tint={customer.lavender} ink={customer.lavenderInk} />
      <StatTile icon="sunny-outline" value={String(summary.gratitude.count)} label="Gratitude entries" tint={customer.gold} ink={customer.goldInk} />
    </View>
  );
}

function openMoodCheckin(): void {
  router.push({ pathname: '/tools/[id]', params: { id: 'mood-check-in' } });
}

function NoAccountMoods({ days }: { days: number }) {
  return (
    <EmptyNote
      icon="happy-outline"
      title={`No mood check-ins on your account in the last ${days} days`}
      body="Mood check-ins saved in the app or on the YuktiOne website appear here."
      actionLabel="Do a mood check-in →"
      onAction={openMoodCheckin}
    />
  );
}

function AccountMoodDistribution({ summary, days }: { summary: ActivitySummary; days: number }) {
  const segments = summary.mood.distribution
    .filter((item) => item.count > 0)
    .map((item) => ({
      label: item.label,
      value: item.count,
      color: ACCOUNT_MOOD_COLORS[item.key] ?? TONE_COLORS[item.tone],
    }));
  if (!segments.length) return <NoAccountMoods days={days} />;
  return (
    <View style={styles.donutRow}>
      <DonutChart segments={segments} center="Check-ins" />
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text style={[myspace.body, styles.grow]}>{segment.label}</Text>
            <Text style={myspace.strong}>{segment.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AccountDailyLog({ summary, days }: { summary: ActivitySummary; days: number }) {
  const labels = new Map(summary.mood.distribution.map((item) => [item.key, item.label]));
  const recent = [...summary.mood.daily].reverse().slice(0, 7);
  if (!recent.length) return <NoAccountMoods days={days} />;
  return (
    <View>
      {recent.map((day, index) => (
        <View key={day.date} style={[styles.logRow, index < recent.length - 1 && styles.logDivider]}>
          <View style={[styles.dot, { backgroundColor: ACCOUNT_MOOD_COLORS[day.mood_key] ?? customer.muted }]} />
          <Text style={[myspace.body, styles.grow]}>{formatWeekdayDate(day.date)}</Text>
          <Text style={myspace.strong}>{labels.get(day.mood_key) ?? day.mood_key}</Text>
          {day.count > 1 ? <Text style={myspace.meta}>+{day.count - 1} more</Text> : null}
        </View>
      ))}
    </View>
  );
}

function ProgrammeProgressList() {
  const state = useCustomerState();
  const rows = state.enrollments
    .map((enrollment) => ({ enrollment, programme: programmeById(enrollment.programmeId) }))
    .filter((row): row is { enrollment: typeof row.enrollment; programme: NonNullable<typeof row.programme> } =>
      Boolean(row.programme),
    );

  if (!rows.length) {
    return (
      <EmptyNote
        icon="layers-outline"
        title="No programmes started"
        body="Start a guided programme and your day-by-day progress shows here."
        actionLabel="Browse programmes →"
        onAction={() => router.push('/programmes')}
      />
    );
  }

  return (
    <>
      {rows.map(({ enrollment, programme }) => {
        const percent = Math.round((enrollment.completedDays.length / programme.plan.length) * 100);
        return (
          <Pressable
            key={programme.id}
            accessibilityRole="button"
            style={styles.programme}
            onPress={() => router.push({ pathname: '/programmes/[id]/learn', params: { id: programme.id } })}
          >
            <Image source={programme.image} style={styles.programmeImage} />
            <View style={styles.grow}>
              <Text style={myspace.strong} numberOfLines={1}>{programme.title}</Text>
              <Text style={myspace.meta}>
                {enrollment.completedDays.length} of {programme.plan.length} days done
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%` }]} />
              </View>
            </View>
            <Text style={styles.percent}>{percent}%</Text>
          </Pressable>
        );
      })}
    </>
  );
}

function MoodTrend({ history, range }: { history: MoodPoint[]; range: Range }) {
  if (history.length < 2) {
    return (
      <EmptyNote
        icon="pulse-outline"
        title={history.length === 1 ? 'One mood tap in this period' : `No mood taps in the last ${range} days`}
        body="The trend line appears after two quick mood taps from Home."
        actionLabel="Check in now →"
        onAction={() => router.push('/(tabs)/home')}
      />
    );
  }
  return (
    <TrendChart
      values={history.map((point) => point.score)}
      labels={history.map((point) => point.date.slice(8))}
    />
  );
}

export function ProgressScreen() {
  const state = useCustomerState();
  const [range, setRange] = useState<Range>('7');
  const history = inRange(state.moodHistory, range);
  const deviceDays = new Set(history.map((point) => point.date)).size;
  const account = useAccountSummary(range);
  const summary = account.query.data;

  return (
    <CustomerPage nav="progress" active="progress" onBack={() => router.back()} right={notificationsButton}>
      <View style={styles.heroRow}>
        <View style={styles.grow}>
          <Heading>My Progress</Heading>
          <Subtitle>Activity from your YuktiOne account, plus what is saved on this device.</Subtitle>
        </View>
        <Image source={art.dawn} style={styles.heroArt} />
      </View>

      <ChipRow options={RANGE_OPTIONS} value={range} onChange={setRange} />

      <Card
        title={`Your account · last ${range} days`}
        source="account"
        action={summary ? 'History ↗' : undefined}
        onAction={() => void openWebsitePath('moodHistory')}
      >
        {account.enabled && summary ? (
          <>
            <AccountStats summary={summary} />
            <Text style={styles.subhead}>Recent days</Text>
            <AccountDailyLog summary={summary} days={account.days} />
            <Text style={myspace.meta}>Days are counted in India time, the same as the website.</Text>
          </>
        ) : (
          <AccountUnavailable
            loading={account.enabled && account.query.isLoading}
            error={account.enabled ? account.query.error : null}
            onRetry={() => void account.query.refetch()}
          />
        )}
      </Card>

      <Card title="On this device" source="device">
        <View style={myspace.grid}>
          <StatTile icon="happy-outline" value={String(history.length)} label={`Mood taps · ${range} days`} tint={customer.green} ink={customer.greenInk} />
          <StatTile icon="calendar-outline" value={plural(deviceDays, 'day')} label="With a mood tap" tint={customer.peach} ink={customer.peachInk} />
          <StatTile icon="layers-outline" value={String(state.enrollments.length)} label="Programmes started" tint={customer.lavender} ink={customer.lavenderInk} />
          <StatTile icon="locate-outline" value={String(state.goals.length)} label="Goals" tint={customer.mint} ink={customer.teal} />
        </View>
      </Card>

      <Card title="Mood taps on this device" source="device">
        <MoodTrend history={history} range={range} />
      </Card>

      <Card title="Goals" source="device" action="Manage →" onAction={() => router.push('/tools/goal-tracker')}>
        {state.goals.length ? (
          state.goals.map((goal) => {
            const percent = goal.total ? Math.min(100, Math.round((goal.done / goal.total) * 100)) : 0;
            return (
              <View key={goal.id} style={styles.goal}>
                <View style={styles.goalTop}>
                  <Text style={myspace.strong} numberOfLines={1}>{goal.title}</Text>
                  <Text style={myspace.meta}>{goal.done} / {goal.total} days</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${percent}%` }]} />
                </View>
              </View>
            );
          })
        ) : (
          <EmptyNote
            icon="locate-outline"
            title="No goals yet"
            body="Set a small daily goal with the Goal Tracker tool."
            actionLabel="Open Goal Tracker →"
            onAction={() => router.push('/tools/goal-tracker')}
          />
        )}
      </Card>

      <Card title="Programme progress" source="device" action="All programmes →" onAction={() => router.push('/programmes')}>
        <ProgrammeProgressList />
      </Card>
    </CustomerPage>
  );
}

function RecentAccountEntries({ days }: { days: RangeDays }) {
  const { moods, journal, gratitude } = useRecentEntries(days);
  const loading = moods.isLoading || journal.isLoading || gratitude.isLoading;
  const error = moods.error ?? journal.error ?? gratitude.error;
  if (loading || error) {
    return (
      <AccountUnavailable
        loading={loading}
        error={error}
        onRetry={() => {
          void moods.refetch();
          void journal.refetch();
          void gratitude.refetch();
        }}
      />
    );
  }

  const rows = [
    ...(moods.data?.entries ?? []).map((entry) => ({
      key: `mood-${entry.id}`,
      kind: 'Mood check-in',
      title: entry.mood_label ?? entry.mood_key,
      detail: entry.emotions.map((emotion) => emotion.label).join(', ') || entry.reflection,
      at: entry.checked_in_at,
    })),
    ...(journal.data?.entries ?? []).map((entry) => ({
      key: `journal-${entry.id}`,
      kind: 'Journal',
      title: entry.title || entry.prompt_label || 'Journal entry',
      detail: entry.excerpt,
      at: entry.written_at,
    })),
    ...(gratitude.data?.entries ?? []).map((entry) => ({
      key: `gratitude-${entry.id}`,
      kind: 'Gratitude',
      title: entry.answers[0]?.label ?? 'Gratitude entry',
      detail: entry.answers[0]?.excerpt ?? null,
      at: entry.written_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (!rows.length) {
    return (
      <EmptyNote
        icon="document-text-outline"
        title={`Nothing written in the last ${days} days`}
        body="Mood check-ins, journal and gratitude entries saved in the app or on the YuktiOne website appear here."
      />
    );
  }

  return (
    <View>
      {rows.slice(0, 6).map((row, index, list) => (
        <View key={row.key} style={[styles.entry, index < list.length - 1 && styles.logDivider]}>
          <Text style={styles.entryKind}>{row.kind} · {formatStamp(row.at)}</Text>
          <Text style={myspace.strong} numberOfLines={1}>{row.title}</Text>
          {row.detail ? <Text style={myspace.body} numberOfLines={2}>{row.detail}</Text> : null}
        </View>
      ))}
      <View style={styles.historyLinks}>
        <Pressable accessibilityRole="button" onPress={() => void openWebsitePath('moodHistory')} hitSlop={6}>
          <Text style={styles.link}>Mood history ↗</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void openWebsitePath('journalHistory')} hitSlop={6}>
          <Text style={styles.link}>Journal ↗</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void openWebsitePath('gratitudeHistory')} hitSlop={6}>
          <Text style={styles.link}>Gratitude ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const state = useCustomerState();
  const [range, setRange] = useState<Range>('7');
  const history = inRange(state.moodHistory, range);
  const account = useAccountSummary(range);
  const summary = account.query.data;
  const average = history.length
    ? (history.reduce((sum, point) => sum + point.score, 0) / history.length).toFixed(1)
    : null;
  const moodSegments = MOODS.map((mood) => ({
    label: mood.label,
    value: history.filter((point) => point.mood === mood.id).length,
    color: mood.ink,
  })).filter((segment) => segment.value > 0);
  const nextProgramme = state.enrollments
    .map((enrollment) => ({ enrollment, programme: programmeById(enrollment.programmeId) }))
    .find(({ enrollment, programme }) => programme && enrollment.completedDays.length < programme.plan.length);

  return (
    <CustomerPage nav="reports" active="reports" onBack={() => router.back()} right={notificationsButton}>
      <View style={styles.heroRow}>
        <View style={styles.grow}>
          <Heading>Reports</Heading>
          <Subtitle>Insights from your YuktiOne account, with device-only data shown separately.</Subtitle>
        </View>
        <Image source={art.lotus} style={styles.heroArt} />
      </View>

      <ChipRow options={RANGE_OPTIONS} value={range} onChange={setRange} />

      <Card title={`Your account · last ${range} days`} source="account">
        {account.enabled && summary ? (
          <AccountStats summary={summary} />
        ) : (
          <AccountUnavailable
            loading={account.enabled && account.query.isLoading}
            error={account.enabled ? account.query.error : null}
            onRetry={() => void account.query.refetch()}
          />
        )}
      </Card>

      {account.enabled && summary ? (
        <Card title="How you felt" source="account">
          <AccountMoodDistribution summary={summary} days={account.days} />
        </Card>
      ) : null}

      {account.enabled ? (
        <Card title="Recent entries" source="account">
          <RecentAccountEntries days={account.days} />
        </Card>
      ) : null}

      <Card title={`On this device · last ${range} days`} source="device">
        <View style={myspace.grid}>
          <StatTile icon="happy-outline" value={average ? `${average}/10` : '—'} label="Average mood tap" tint={customer.green} ink={customer.greenInk} />
          <StatTile icon="checkmark-done-outline" value={String(history.length)} label="Mood taps" tint={customer.sky} ink={customer.skyInk} />
          <StatTile icon="bookmark-outline" value={String(state.savedToolIds.length)} label="Saved tools" tint={customer.mint} ink={customer.teal} />
          <StatTile icon="book-outline" value={String(state.journal.length)} label="Journal notes" tint={customer.lavender} ink={customer.lavenderInk} />
        </View>
      </Card>

      <Card title="Mood taps on this device" source="device">
        <MoodTrend history={history} range={range} />
        {moodSegments.length ? (
          <View style={styles.donutRow}>
            <DonutChart segments={moodSegments} center="Taps" />
            <View style={styles.legend}>
              {moodSegments.map((segment) => (
                <View key={segment.label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: segment.color }]} />
                  <Text style={[myspace.body, styles.grow]}>{segment.label}</Text>
                  <Text style={myspace.strong}>{segment.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <Card title="Programme progress" source="device">
        <ProgrammeProgressList />
      </Card>

      <Card title="Your next step" tone="mint">
        {nextProgramme?.programme ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/programmes/[id]/learn', params: { id: nextProgramme.programme!.id } })
            }
          >
            <Text style={myspace.body}>
              Continue <Text style={myspace.strong}>{nextProgramme.programme.title}</Text> — day{' '}
              {nextProgramme.enrollment.completedDays.length + 1} is next.
            </Text>
            <Text style={styles.link}>Continue programme →</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={openMoodCheckin}>
            <Text style={myspace.body}>
              A daily mood check-in builds a clearer picture on your account over time.
            </Text>
            <Text style={styles.link}>Do a mood check-in →</Text>
          </Pressable>
        )}
      </Card>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  heroRow: { flexDirection: 'row', gap: 8 },
  heroArt: { width: 92, height: 72, borderRadius: 16 },
  subhead: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  goal: { gap: 6 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  track: { height: 8, borderRadius: 8, backgroundColor: customer.mintDeep, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 8, backgroundColor: customer.teal },
  programme: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programmeImage: { width: 52, height: 52, borderRadius: 14 },
  percent: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.teal },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  logDivider: { borderBottomWidth: 1, borderBottomColor: customer.line },
  entry: { gap: 2, paddingVertical: 10 },
  entryKind: { fontFamily: customerFonts.medium, fontSize: 11.5, color: customer.teal },
  historyLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  link: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal, marginTop: 8 },
});
