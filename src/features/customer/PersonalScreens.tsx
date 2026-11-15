import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PROGRAMMES, TOOLS, art, programmeById, toIsoDate } from '@/features/customer/content';
import { customerActions, useCustomerState } from '@/features/customer/store';
import {
  ChipRow,
  CustomerPage,
  DonutChart,
  Heading,
  IconButton,
  OutlineButton,
  SectionTitle,
  Subtitle,
  TealButton,
  TrendChart,
} from '@/features/customer/ui';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import type { ApiUser } from '@/services/api/auth';
import { fetchProfile, updateProfile } from '@/services/api/profile';
import { customer, customerFonts } from '@/theme';

type ProfileDraft = {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  address: string;
};

function draftFromUser(user: ApiUser): ProfileDraft {
  const profile = user.customer_profile;
  return {
    name: profile?.name || user.name || '',
    email: profile?.email || user.email || '',
    phone: profile?.phone || user.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zip: profile?.zip_code || '',
    address: profile?.address || '',
  };
}

const USAGE = [
  { label: 'Mood Check-in', value: 4, color: '#1F9D6A' },
  { label: 'Journal', value: 3, color: '#6E5BD6' },
  { label: 'Tarot', value: 2, color: '#E0A100' },
  { label: 'Others', value: 3, color: '#3D6FE0' },
];

export function MySpaceScreen() {
  const state = useCustomerState();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'tools' | 'progress' | 'favourites' | 'saved'>('overview');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();

  const profileQuery = useQuery({
    queryKey: ['v1', 'profile'],
    queryFn: async () => {
      const result = await fetchProfile();
      if (!result.ok) throw new Error(result.message);
      customerActions.signInFromApi(result.user);
      return result.user;
    },
    enabled: liveEnabled,
  });

  const today = toIsoDate(new Date());
  const mood = state.moodHistory.find((point) => point.date === today) ?? state.moodHistory[state.moodHistory.length - 1];
  const savedTools = TOOLS.filter((tool) => state.savedToolIds.includes(tool.id));
  const savedProgrammes = PROGRAMMES.filter((programme) => state.savedProgrammeIds.includes(programme.id));
  const profile = profileQuery.data;

  const beginEdit = () => {
    if (!profile) return;
    setDraft(draftFromUser(profile));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveProfile = async () => {
    if (saving || !draft) return;
    setSaving(true);
    try {
      const result = await updateProfile({
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || undefined,
        city: draft.city.trim(),
        state: draft.state.trim(),
        zip_code: draft.zip.trim(),
        address: draft.address.trim() || undefined,
      });
      if (!result.ok) {
        Alert.alert('Could not update profile', result.message);
        return;
      }
      customerActions.signInFromApi(result.user);
      await queryClient.invalidateQueries({ queryKey: ['v1', 'profile'] });
      setDraft(null);
      setEditing(false);
      Alert.alert('Profile updated', result.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerPage
      nav="space"
      active="my-space"
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="calendar-outline" label="Bookings" onPress={() => router.push('/(tabs)/bookings')} />
          <IconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/(tabs)/bookings')} />
          <IconButton icon="settings-outline" label="Menu" onPress={() => router.push('/reports')} />
        </>
      }
    >
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Heading>My Space</Heading>
          <Subtitle>Your personal space for reflection, progress and well-being.</Subtitle>
        </View>
        <Image source={art.lake} style={styles.heroArt} />
      </View>
      <ChipRow
        options={[
          { id: 'overview', label: 'Overview', icon: 'grid-outline' },
          { id: 'tools', label: 'My Tools', icon: 'leaf-outline' },
          { id: 'progress', label: 'My Progress', icon: 'stats-chart-outline' },
          { id: 'favourites', label: 'Favourites', icon: 'heart-outline' },
          { id: 'saved', label: 'Saved', icon: 'bookmark-outline' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'overview' ? (
        <>
          <SectionTitle
            title="Your Account"
            action={editing ? 'Cancel' : 'Edit'}
            onAction={() => (editing ? cancelEdit() : beginEdit())}
          />
          {profileQuery.isLoading ? <ActivityIndicator color={customer.teal} /> : null}
          {profileQuery.isError ? (
            <Text style={styles.body}>{profileQuery.error.message}</Text>
          ) : null}
          {profile ? (
            editing && draft ? (
              <View style={styles.profileForm}>
                <TextInput style={styles.input} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Full name" placeholderTextColor={customer.muted} />
                <TextInput style={styles.input} value={draft.email} onChangeText={(email) => setDraft({ ...draft, email })} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={customer.muted} />
                <TextInput style={styles.input} value={draft.phone} onChangeText={(phone) => setDraft({ ...draft, phone })} placeholder="Phone" keyboardType="phone-pad" placeholderTextColor={customer.muted} />
                <TextInput style={styles.input} value={draft.city} onChangeText={(city) => setDraft({ ...draft, city })} placeholder="City" placeholderTextColor={customer.muted} />
                <TextInput style={styles.input} value={draft.state} onChangeText={(next) => setDraft({ ...draft, state: next })} placeholder="State" placeholderTextColor={customer.muted} />
                <TextInput style={styles.input} value={draft.zip} onChangeText={(zip) => setDraft({ ...draft, zip })} placeholder="ZIP / PIN" placeholderTextColor={customer.muted} />
                <TextInput style={styles.input} value={draft.address} onChangeText={(address) => setDraft({ ...draft, address })} placeholder="Address" placeholderTextColor={customer.muted} />
                <TealButton label={saving ? 'Saving…' : 'Save profile'} onPress={() => void saveProfile()} disabled={saving} />
              </View>
            ) : (
              <View style={styles.profileCard}>
                <Text style={styles.title}>{profile.name}</Text>
                <Text style={styles.body}>{profile.email}</Text>
                <Text style={styles.body}>{profile.phone || 'No phone on file'}</Text>
                <Text style={styles.meta}>
                  {[profile.customer_profile?.city, profile.customer_profile?.state, profile.customer_profile?.zip_code]
                    .filter(Boolean)
                    .join(', ') || 'City / state not set yet'}
                </Text>
              </View>
            )
          ) : null}
          <SectionTitle title="Today's Check-In" action="Complete your daily wellness ritual." />
          <View style={styles.checkin}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>How are you feeling today?</Text>
              <Text style={styles.body}>Complete a quick mood check-in.</Text>
            </View>
            <TealButton label="Check in Now" icon="add" onPress={() => router.push('/(tabs)/home')} />
          </View>
          <Text style={styles.section}>Your Wellness Snapshot</Text>
          <View style={styles.stats}>
            <Stat label="Mood" value={mood ? mood.mood : '—'} tint={customer.green} />
            <Stat label="Streak" value="5 Days" tint={customer.mint} />
            <Stat label="Tools Completed" value="12" tint="#F1ECFF" />
            <Stat label="Programmes" value={`${state.enrollments.length} Enrolled`} tint="#F1ECFF" />
          </View>
          <SectionTitle title="Your Recent Activity" action="View All →" onAction={() => setTab('progress')} />
          {state.activities.slice(0, 3).map((activity) => (
            <View key={activity.id} style={styles.activity}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{activity.title}</Text>
                <Text style={styles.body}>{activity.detail}</Text>
              </View>
              <Text style={styles.meta}>{activity.at}</Text>
            </View>
          ))}
          <SectionTitle title="Your Goals" action="Manage Goals →" onAction={() => router.push('/tools/goal-tracker')} />
          {state.goals.map((goal) => (
            <View key={goal.id} style={styles.goal}>
              <View style={styles.goalTop}>
                <Text style={styles.title}>{goal.title}</Text>
                <Text style={styles.meta}>{goal.done} / {goal.total} Days</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${(goal.done / goal.total) * 100}%` }]} /></View>
            </View>
          ))}
        </>
      ) : null}
      {tab === 'tools' ? (
        savedTools.length ? savedTools.map((tool) => (
          <Pressable key={tool.id} onPress={() => router.push({ pathname: '/tools/[id]', params: { id: tool.id } })}>
            <Text style={styles.title}>{tool.name}</Text>
            <Text style={styles.body}>{tool.blurb}</Text>
          </Pressable>
        )) : <Text style={styles.body}>Save a tool from All Tools to see it here.</Text>
      ) : null}
      {tab === 'progress' ? <TealButton label="Open My Progress" onPress={() => router.push('/progress')} /> : null}
      {tab === 'favourites' ? <Text style={styles.body}>{state.favouriteExpertIds.length ? state.favouriteExpertIds.join(', ') : 'No favourite experts yet.'}</Text> : null}
      {tab === 'saved' ? (
        savedProgrammes.length ? savedProgrammes.map((programme) => (
          <Pressable key={programme.id} onPress={() => router.push({ pathname: '/programmes/[id]', params: { id: programme.id } })}>
            <Text style={styles.title}>{programme.title}</Text>
          </Pressable>
        )) : <Text style={styles.body}>No saved programmes yet.</Text>
      ) : null}
    </CustomerPage>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function ProgressScreen() {
  const state = useCustomerState();
  const [range, setRange] = useState<'7' | '30' | '90'>('7');
  const history = state.moodHistory.slice(range === '7' ? -7 : range === '30' ? -30 : -90);
  return (
    <CustomerPage
      nav="progress"
      active="progress"
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="calendar-outline" label="Bookings" onPress={() => router.push('/(tabs)/bookings')} />
          <IconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/reports')} />
          <IconButton icon="settings-outline" label="Reports" onPress={() => router.push('/reports')} />
        </>
      }
    >
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Heading>My Progress</Heading>
          <Subtitle>Track your journey, build healthy habits and see your growth over time.</Subtitle>
        </View>
        <Image source={art.dawn} style={styles.heroArt} />
      </View>
      <ChipRow
        options={[
          { id: 'overview', label: 'Overview', icon: 'stats-chart-outline' },
          { id: 'mood', label: 'Mood' },
          { id: 'habits', label: 'Habits' },
          { id: 'programmes', label: 'Programmes' },
          { id: 'achievements', label: 'Achievements' },
        ]}
        value="overview"
        onChange={() => undefined}
      />
      <View style={styles.stats}>
        <Stat label="Days Active" value="12" tint={customer.mint} />
        <Stat label="Current Streak" value="5 Days" tint="#FFF1E4" />
        <Stat label="Programmes Enrolled" value={`${state.enrollments.length}`} tint="#F1ECFF" />
        <Stat label="Achievements" value="7" tint="#FFF6DE" />
      </View>
      <SectionTitle title="Your Mood Trend" />
      <ChipRow
        options={[{ id: '7', label: '7 Days' }, { id: '30', label: '30 Days' }, { id: '90', label: '90 Days' }]}
        value={range}
        onChange={setRange}
      />
      <TrendChart values={history.map((point) => point.score)} labels={history.map((point) => point.date.slice(8))} />
      <View style={styles.split}>
        <View style={styles.panel}>
          <Text style={styles.title}>Goals Progress</Text>
          {state.goals.map((goal) => (
            <View key={goal.id}>
              <Text style={styles.body}>{goal.title}</Text>
              <Text style={styles.meta}>{goal.done} / {goal.total} Days</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${(goal.done / goal.total) * 100}%` }]} /></View>
            </View>
          ))}
        </View>
        <View style={styles.panel}>
          <Text style={styles.title}>Tools Usage</Text>
          <DonutChart segments={USAGE} center="Uses" />
          {USAGE.map((item) => (
            <Text key={item.label} style={styles.meta}>{item.label} {item.value}</Text>
          ))}
        </View>
      </View>
      <SectionTitle title="Programme Progress" action="View All →" onAction={() => router.push('/programmes')} />
      {state.enrollments.map((enrollment) => {
        const programme = programmeById(enrollment.programmeId);
        if (!programme) return null;
        const percent = Math.round((enrollment.completedDays.length / programme.plan.length) * 100);
        return (
          <Pressable key={enrollment.programmeId} style={styles.activity} onPress={() => router.push({ pathname: '/programmes/[id]/learn', params: { id: programme.id } })}>
            <Image source={programme.image} style={styles.mini} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{programme.title}</Text>
              <Text style={styles.meta}>Day {enrollment.completedDays.length} of {programme.days}</Text>
            </View>
            <Text style={styles.price}>{percent}%</Text>
          </Pressable>
        );
      })}
      <Text style={styles.section}>Achievements (7)</Text>
      <View style={styles.stats}>
        {['Getting Started', '7-Day Streak', 'Mindful Explorer'].map((label) => (
          <View key={label} style={styles.badge}><Text style={styles.meta}>{label}</Text></View>
        ))}
      </View>
      <View style={styles.note}>
        <Text style={styles.title}>You&apos;re making great progress!</Text>
        <Text style={styles.body}>Keep going — small, consistent steps create big change.</Text>
      </View>
    </CustomerPage>
  );
}

export function ReportsScreen() {
  const state = useCustomerState();
  const [range, setRange] = useState<'7' | '30' | '90' | 'custom'>('7');
  const [metric, setMetric] = useState<'mood' | 'energy' | 'stress' | 'focus'>('mood');
  const history = state.moodHistory.slice(-7);
  const average = history.length
    ? (history.reduce((sum, point) => sum + point.score, 0) / history.length).toFixed(1)
    : '—';
  const stress = programmeById('stress-relief-7');
  return (
    <CustomerPage
      nav="reports"
      active="reports"
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="download-outline" label="Download report" onPress={() => Alert.alert('Download unavailable', 'A report file is not generated until the reports API exists. Nothing was downloaded.')} />
          <IconButton icon="calendar-outline" label="Custom range" onPress={() => setRange('custom')} />
        </>
      }
    >
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Heading>Reports</Heading>
          <Subtitle>Your wellness insights, trends and personal growth report.</Subtitle>
        </View>
        <Image source={art.lotus} style={styles.heroArt} />
      </View>
      <ChipRow
        options={[
          { id: 'overview', label: 'Overview' },
          { id: 'mood', label: 'Mood' },
          { id: 'habits', label: 'Habits' },
          { id: 'tools', label: 'Tools' },
          { id: 'programmes', label: 'Programmes' },
        ]}
        value="overview"
        onChange={() => undefined}
      />
      <ChipRow
        options={[
          { id: '7', label: '7 Days' },
          { id: '30', label: '30 Days' },
          { id: '90', label: '90 Days' },
          { id: 'custom', label: 'Custom' },
        ]}
        value={range}
        onChange={setRange}
      />
      <Text style={styles.meta}>{range === 'custom' ? 'Choose dates when the reports API is connected.' : `Showing the last ${range} days saved on this device.`}</Text>
      <Text style={styles.section}>Wellness Summary</Text>
      <View style={styles.stats}>
        <Stat label="Avg. Mood" value={`${average}/10`} tint={customer.green} />
        <Stat label="Tools Used" value={`${state.savedToolIds.length || 12}`} tint="#F1ECFF" />
        <Stat label="Active Days" value={`${history.length}`} tint={customer.blue} />
        <Stat label="Achievements" value="3" tint="#FFF6DE" />
      </View>
      <SectionTitle title="Mood Trend" />
      <ChipRow
        options={[
          { id: 'mood', label: 'Mood' },
          { id: 'energy', label: 'Energy' },
          { id: 'stress', label: 'Stress' },
          { id: 'focus', label: 'Focus' },
        ]}
        value={metric}
        onChange={setMetric}
      />
      {metric === 'mood' ? (
        <TrendChart values={history.map((point) => point.score)} labels={history.map((point) => point.date.slice(5))} />
      ) : (
        <Text style={styles.body}>{metric[0]?.toUpperCase()}{metric.slice(1)} is not measured yet. Only mood check-ins are stored on this device.</Text>
      )}
      <View style={styles.split}>
        <View style={styles.panel}>
          <Text style={styles.title}>Tool Usage</Text>
          <DonutChart segments={USAGE} center="Uses" />
        </View>
        <View style={styles.panel}>
          <Text style={styles.title}>Programme Progress</Text>
          {stress ? (
            <View>
              <Image source={stress.image} style={styles.mini} />
              <Text style={styles.body}>{stress.title}</Text>
            </View>
          ) : null}
          {state.enrollments.map((enrollment) => {
            const programme = programmeById(enrollment.programmeId);
            if (!programme) return null;
            const percent = Math.round((enrollment.completedDays.length / programme.plan.length) * 100);
            return (
              <View key={enrollment.programmeId}>
                <Text style={styles.body}>{programme.title}</Text>
                <View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
                <Text style={styles.meta}>{percent}%</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.note}>
        <Text style={styles.title}>Your Insights</Text>
        <Text style={styles.body}>Mood entries on this device are the only measured series. Other insight sentences from the design are not calculated, so they are not shown as facts.</Text>
      </View>
      <View style={styles.activity}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Your Next Step</Text>
          <Text style={styles.body}>Continue the next unlocked day of your enrolled programme.</Text>
        </View>
        <OutlineButton label="Continue Programme" onPress={() => router.push('/programmes/stress-relief-7/learn')} />
      </View>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', gap: 8 },
  heroArt: { width: 92, height: 72, borderRadius: 16 },
  checkin: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E8', borderRadius: 18, padding: 12 },
  title: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  body: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.body, lineHeight: 18 },
  meta: { fontFamily: customerFonts.regular, fontSize: 12, color: customer.muted },
  profileCard: {
    backgroundColor: customer.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 14,
    gap: 4,
  },
  profileForm: { gap: 8 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 12,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: customer.navy,
  },
  section: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '48%', flexGrow: 1, borderRadius: 16, padding: 12, gap: 4 },
  statValue: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy, textTransform: 'capitalize' },
  activity: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: customer.white, borderRadius: 16, borderWidth: 1, borderColor: customer.line, padding: 12 },
  goal: { gap: 6 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E6EEF0', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: customer.teal },
  split: { flexDirection: 'row', gap: 8 },
  panel: { flex: 1, backgroundColor: customer.white, borderRadius: 16, borderWidth: 1, borderColor: customer.line, padding: 10, gap: 6 },
  mini: { width: '100%', height: 52, borderRadius: 8 },
  badge: { backgroundColor: customer.mint, borderRadius: 14, padding: 10 },
  note: { backgroundColor: customer.mint, borderRadius: 16, padding: 14, gap: 6 },
  price: { fontFamily: customerFonts.bold, color: customer.teal },
});
