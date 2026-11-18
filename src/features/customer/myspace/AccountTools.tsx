import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  newCompletionKey,
  usePsychologyOptions,
  useSaveEntry,
} from '@/features/customer/myspace/accountData';
import { Card, EmptyNote, myspace } from '@/features/customer/myspace/parts';
import { TealButton } from '@/features/customer/ui';
import {
  saveGratitudeEntry,
  saveJournalEntry,
  saveMoodCheckin,
  type MoodTone,
  type PsychologyOptions,
} from '@/services/api/mySpace';
import { customer, customerFonts } from '@/theme';

const TONE: Record<MoodTone, { bg: string; ink: string }> = {
  positive: { bg: customer.green, ink: customer.greenInk },
  neutral: { bg: customer.gold, ink: customer.goldInk },
  difficult: { bg: customer.pink, ink: customer.pinkInk },
};

export function SignInToSave({ what }: { what: string }) {
  return (
    <EmptyNote
      icon="log-in-outline"
      title="Sign in to save"
      body={`Your ${what} is saved to your YuktiOne account, the same as on the website. Sign in to continue.`}
      actionLabel="Sign in"
      onAction={() => router.push('/auth')}
    />
  );
}

function OptionsGate({ children }: { children: (options: PsychologyOptions) => ReactNode }) {
  const query = usePsychologyOptions();
  if (query.isLoading) return <ActivityIndicator color={customer.teal} style={styles.loader} />;
  if (query.isError || !query.data) {
    return (
      <EmptyNote
        icon="cloud-offline-outline"
        title="Could not load this tool"
        body={query.error?.message ?? 'Please try again.'}
        actionLabel="Try again"
        onAction={() => void query.refetch()}
      />
    );
  }
  return <>{children(query.data)}</>;
}

function Closed() {
  return (
    <EmptyNote
      icon="pause-circle-outline"
      title="Not available right now"
      body="This tool has been paused on YuktiOne. Please check back later."
    />
  );
}

function Saved({ title, detail, onAgain }: { title: string; detail?: string; onAgain: () => void }) {
  return (
    <Card tone="mint">
      <View style={styles.savedHead}>
        <Ionicons name="checkmark-circle" size={26} color={customer.teal} />
        <View style={styles.grow}>
          <Text style={myspace.strong}>{title}</Text>
          <View style={styles.savedTag}>
            <Ionicons name="cloud-done-outline" size={14} color={customer.teal} />
            <Text style={styles.savedTagText}>Saved to your account</Text>
          </View>
        </View>
      </View>
      {detail ? <Text style={myspace.body}>{detail}</Text> : null}
      <Text style={myspace.meta}>It now shows in My Progress, Reports and on the website.</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/progress')} hitSlop={6}>
          <Text style={styles.link}>See my progress</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onAgain} hitSlop={6}>
          <Text style={styles.link}>Write another</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  return <Text style={[myspace.meta, styles.counter]}>{value.length} / {max}</Text>;
}

function failed(error: Error) {
  Alert.alert('Not saved', `${error.message}\n\nNothing was saved. You can try again.`);
}

export function AccountMoodCheckin() {
  const [key, setKey] = useState(newCompletionKey);
  const [mood, setMood] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [reflection, setReflection] = useState('');
  const [step, setStep] = useState<'mood' | 'emotions' | 'reflection'>('mood');
  const save = useSaveEntry(saveMoodCheckin);

  const restart = () => {
    setKey(newCompletionKey());
    setMood(null);
    setEmotions([]);
    setReflection('');
    setStep('mood');
    save.reset();
  };

  return (
    <OptionsGate>
      {(options) => {
        const config = options.mood;
        if (!config.open) return <Closed />;
        if (save.data) {
          return (
            <Saved
              title={`Check-in saved: ${save.data.entry.mood_label ?? 'Mood recorded'}`}
              detail={save.data.entry.emotions.map((item) => item.label).join(', ')}
              onAgain={restart}
            />
          );
        }

        const toggle = (emotion: string) =>
          setEmotions((current) =>
            current.includes(emotion)
              ? current.filter((item) => item !== emotion)
              : current.length >= config.max_emotions
                ? current
                : [...current, emotion],
          );

        return (
          <View style={styles.stack}>
            <Text style={styles.step}>
              Step {step === 'mood' ? 1 : step === 'emotions' ? 2 : 3} of 3 · Saved to your account
            </Text>
            {step === 'mood' ? (
              <>
                <Text style={styles.question}>How are you feeling right now?</Text>
                {config.moods.map((option) => (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mood === option.key }}
                    onPress={() => setMood(option.key)}
                    style={[styles.choiceRow, mood === option.key && styles.choiceRowOn]}
                  >
                    <View style={[styles.toneDot, { backgroundColor: TONE[option.tone].ink }]} />
                    <View style={styles.grow}>
                      <Text style={myspace.strong}>{option.label}</Text>
                      <Text style={myspace.meta}>{option.caption}</Text>
                    </View>
                    {mood === option.key ? <Ionicons name="checkmark-circle" size={20} color={customer.teal} /> : null}
                  </Pressable>
                ))}
                <TealButton label="Next" disabled={!mood} onPress={() => setStep('emotions')} />
              </>
            ) : null}
            {step === 'emotions' ? (
              <>
                <Text style={styles.question}>Which emotions fit? Pick up to {config.max_emotions}.</Text>
                {config.emotion_groups.map((group) => (
                  <View key={group.tone} style={styles.group}>
                    <Text style={[styles.groupLabel, { color: TONE[group.tone].ink }]}>
                      {group.tone.charAt(0).toUpperCase() + group.tone.slice(1)}
                    </Text>
                    <View style={styles.wrap}>
                      {group.emotions.map((emotion) => {
                        const on = emotions.includes(emotion.key);
                        return (
                          <Pressable
                            key={emotion.key}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            onPress={() => toggle(emotion.key)}
                            style={[styles.chip, on && { backgroundColor: TONE[group.tone].bg, borderColor: TONE[group.tone].ink }]}
                          >
                            <Text style={[styles.chipText, on && { color: TONE[group.tone].ink }]}>{emotion.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
                <Text style={myspace.meta}>{emotions.length} of {config.max_emotions} selected</Text>
                <TealButton label="Next" disabled={emotions.length < config.min_emotions} onPress={() => setStep('reflection')} />
                <Pressable accessibilityRole="button" onPress={() => setStep('mood')} hitSlop={6}>
                  <Text style={styles.link}>Back</Text>
                </Pressable>
              </>
            ) : null}
            {step === 'reflection' ? (
              <>
                <Text style={styles.question}>Anything you want to note? (optional)</Text>
                <TextInput
                  value={reflection}
                  accessibilityLabel="Reflection (optional)"
                  onChangeText={setReflection}
                  maxLength={config.reflection_max}
                  placeholder="A few words about your day"
                  placeholderTextColor={customer.muted}
                  multiline
                  textAlignVertical="top"
                  style={[myspace.input, styles.area]}
                />
                <Counter value={reflection} max={config.reflection_max} />
                <TealButton
                  label={save.isPending ? 'Saving…' : 'Save check-in'}
                  disabled={save.isPending || !mood}
                  onPress={() =>
                    mood &&
                    save.mutate(
                      { completion_key: key, mood, emotions, reflection: reflection.trim() || undefined },
                      { onError: failed },
                    )
                  }
                />
                <Pressable accessibilityRole="button" onPress={() => setStep('emotions')} hitSlop={6}>
                  <Text style={styles.link}>Back</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        );
      }}
    </OptionsGate>
  );
}

export function AccountJournal() {
  const [key, setKey] = useState(newCompletionKey);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const save = useSaveEntry(saveJournalEntry);

  const restart = () => {
    setKey(newCompletionKey());
    setTitle('');
    setBody('');
    save.reset();
  };

  return (
    <OptionsGate>
      {(options) => {
        const config = options.journal;
        if (!config.open) return <Closed />;
        if (save.data) {
          return (
            <Saved
              title={`Journal saved${save.data.entry.title ? `: ${save.data.entry.title}` : ''}`}
              detail={save.data.entry.prompt_label ?? undefined}
              onAgain={restart}
            />
          );
        }
        const selected = config.prompts.find((item) => item.key === prompt) ?? null;

        return (
          <View style={styles.stack}>
            <Text style={styles.step}>Saved to your account · private to you</Text>
            <Text style={styles.question}>Choose a prompt</Text>
            <View style={styles.wrap}>
              {config.prompts.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: prompt === item.key }}
                  onPress={() => setPrompt(item.key)}
                  style={[styles.chip, prompt === item.key && styles.chipOn]}
                >
                  <Text style={[styles.chipText, prompt === item.key && styles.chipTextOn]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            {selected?.question ? <Text style={myspace.body}>{selected.question}</Text> : null}
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={config.title_max}
              placeholder="Title (optional)"
              placeholderTextColor={customer.muted}
              style={myspace.input}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              maxLength={config.body_max}
              placeholder="Write your thoughts"
              placeholderTextColor={customer.muted}
              multiline
              textAlignVertical="top"
              style={[myspace.input, styles.areaTall]}
            />
            <Counter value={body} max={config.body_max} />
            <TealButton
              label={save.isPending ? 'Saving…' : 'Save journal entry'}
              disabled={save.isPending || !prompt || !body.trim()}
              onPress={() =>
                prompt &&
                save.mutate(
                  { completion_key: key, prompt_key: prompt, title: title.trim() || undefined, body },
                  { onError: failed },
                )
              }
            />
          </View>
        );
      }}
    </OptionsGate>
  );
}

export function AccountGratitude() {
  const [key, setKey] = useState(newCompletionKey);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const save = useSaveEntry(saveGratitudeEntry);

  const restart = () => {
    setKey(newCompletionKey());
    setAnswers({});
    save.reset();
  };

  return (
    <OptionsGate>
      {(options) => {
        const config = options.gratitude;
        if (!config.open) return <Closed />;
        if (save.data) {
          return (
            <Saved
              title="Gratitude saved"
              detail={save.data.entry.answers.map((item) => `${item.label}: ${item.excerpt}`).join('\n')}
              onAgain={restart}
            />
          );
        }
        const answered = Object.values(answers).filter((value) => value.trim()).length;

        return (
          <View style={styles.stack}>
            <Text style={styles.step}>Saved to your account · answer at least {config.min_answered}</Text>
            {config.cards.map((card) => (
              <View key={card.key} style={styles.card}>
                <Text style={myspace.strong}>{card.label}</Text>
                {card.question ? <Text style={myspace.body}>{card.question}</Text> : null}
                {card.hint ? <Text style={myspace.meta}>{card.hint}</Text> : null}
                <TextInput
                  value={answers[card.key] ?? ''}
                  accessibilityLabel={card.label}
                  onChangeText={(value) => setAnswers((current) => ({ ...current, [card.key]: value }))}
                  maxLength={config.answer_max}
                  placeholder="Optional"
                  placeholderTextColor={customer.muted}
                  multiline
                  textAlignVertical="top"
                  style={[myspace.input, styles.area]}
                />
              </View>
            ))}
            <TealButton
              label={save.isPending ? 'Saving…' : 'Finish & save'}
              disabled={save.isPending || answered < config.min_answered}
              onPress={() =>
                save.mutate(
                  {
                    completion_key: key,
                    answers: Object.fromEntries(
                      Object.entries(answers).filter(([, value]) => value.trim()).map(([card, value]) => [card, value.trim()]),
                    ),
                  },
                  { onError: failed },
                )
              }
            />
          </View>
        );
      }}
    </OptionsGate>
  );
}

const styles = StyleSheet.create({
  loader: { paddingVertical: 24 },
  stack: { gap: 12 },
  grow: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', gap: 20 },
  step: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.teal },
  question: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 14,
  },
  choiceRowOn: { borderColor: customer.teal, backgroundColor: customer.mint },
  toneDot: { width: 12, height: 12, borderRadius: 6 },
  group: { gap: 8 },
  groupLabel: { fontFamily: customerFonts.bold, fontSize: 13 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: customer.teal, borderColor: customer.teal },
  chipText: { fontFamily: customerFonts.medium, fontSize: 13, color: customer.navy },
  chipTextOn: { color: customer.white },
  area: { minHeight: 96, paddingTop: 12 },
  areaTall: { minHeight: 180, paddingTop: 12 },
  counter: { alignSelf: 'flex-end', marginTop: -6 },
  card: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 14,
  },
  savedHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  savedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedTagText: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.teal },
  link: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },
});
