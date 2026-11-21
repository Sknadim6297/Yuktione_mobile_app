import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BrandGradient } from '@/components/brand';
import { FadeInView, PressableScale } from '@/components/motion';
import {
  newCompletionKey,
  useAccountScope,
  usePsychologyOptions,
  useSaveEntry,
} from '@/features/customer/myspace/accountData';
import { SignInToSave } from '@/features/customer/myspace/AccountTools';
import { RemoteImage } from '@/features/customer/home/media';
import { CustomerPage, IconButton } from '@/features/customer/ui';
import { ToolProgress } from '@/features/tools/chrome/ToolProgress';
import { ToolStepHeader } from '@/features/tools/chrome/ToolStepHeader';
import { MoodFace } from '@/features/tools/mood/MoodFace';
import { saveMoodCheckin, type MoodTone, type PsychologyOptions } from '@/services/api/mySpace';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customer, customerFonts, motion, shadows } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Step = 'mood' | 'emotions' | 'reflection' | 'success';

const STEPS = [
  { id: 'mood', label: 'Mood' },
  { id: 'emotions', label: 'Emotions' },
  { id: 'reflection', label: 'Reflect' },
  { id: 'success', label: 'Done' },
] as const;

const TONE: Record<MoodTone, { bg: string; ink: string; soft: string }> = {
  positive: { bg: customer.green, ink: customer.greenInk, soft: '#F3FAF5' },
  neutral: { bg: customer.gold, ink: customer.goldInk, soft: '#FFFBF0' },
  difficult: { bg: customer.pink, ink: customer.pinkInk, soft: '#FFF5F8' },
};

const GROUP_LABEL: Record<MoodTone, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  difficult: 'Difficult',
};

const ILLUSTRATION = 'frontend/assets/img/tools-illustrations/daily-mood-3d.webp';

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

export function MoodCheckinScreen() {
  const account = useAccountScope();
  const options = usePsychologyOptions();
  const save = useSaveEntry(saveMoodCheckin);
  const reduceMotion = useReducedMotion();

  const [key, setKey] = useState(newCompletionKey);
  const [mood, setMood] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [reflection, setReflection] = useState('');
  const [step, setStep] = useState<Step>('mood');
  const [limitHint, setLimitHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const config = options.data?.mood;

  const selectedMood = useMemo(
    () => config?.moods.find((item) => item.key === mood) ?? null,
    [config, mood],
  );

  const restart = () => {
    setKey(newCompletionKey());
    setMood(null);
    setEmotions([]);
    setReflection('');
    setStep('mood');
    setLimitHint(false);
    setErrorMessage(null);
    save.reset();
  };

  const toggleEmotion = (emotionKey: string, max: number) => {
    setEmotions((current) => {
      if (current.includes(emotionKey)) {
        setLimitHint(false);
        return current.filter((item) => item !== emotionKey);
      }
      if (current.length >= max) {
        setLimitHint(true);
        return current;
      }
      setLimitHint(false);
      return [...current, emotionKey];
    });
  };

  const onSave = () => {
    if (!mood || !config || save.isPending) return;
    setErrorMessage(null);
    save.mutate(
      {
        completion_key: key,
        mood,
        emotions,
        reflection: reflection.trim() || undefined,
      },
      {
        onError: (error) => {
          setErrorMessage(error.message || 'Nothing was saved. You can try again.');
        },
      },
    );
  };

  const activeStep: Step = save.data ? 'success' : step;

  if (!account.enabled) {
    return (
      <CustomerPage onBack={goBack}>
        <IntroArt />
        <ToolStepHeader
          eyebrow="Daily Mood Check-in"
          title="How are you feeling today?"
          body="Take a moment to check in with yourself."
        />
        <SignInToSave what="check-in" />
      </CustomerPage>
    );
  }

  if (options.isLoading) {
    return (
      <CustomerPage onBack={goBack}>
        <ActivityIndicator color={customer.teal} style={{ marginTop: 40 }} />
      </CustomerPage>
    );
  }

  if (options.isError || !config) {
    return (
      <CustomerPage onBack={goBack}>
        <StateCard
          icon="cloud-offline-outline"
          title="Could not load this tool"
          body={options.error?.message ?? 'Check your connection and try again.'}
          action="Try again"
          onAction={() => void options.refetch()}
        />
      </CustomerPage>
    );
  }

  if (!config.open) {
    return (
      <CustomerPage onBack={goBack}>
        <StateCard
          icon="pause-circle-outline"
          title="Not available right now"
          body="This tool has been paused on YuktiOne. Please check back later."
          action="Back to tools"
          onAction={goBack}
        />
      </CustomerPage>
    );
  }

  const footer =
    activeStep === 'mood' ? (
      <PrimaryAction
        label="Next"
        disabled={!mood}
        onPress={() => setStep('emotions')}
      />
    ) : activeStep === 'emotions' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label="Continue"
          disabled={emotions.length < config.min_emotions}
          onPress={() => setStep('reflection')}
        />
        <TextLink label="Back" onPress={() => setStep('mood')} />
      </View>
    ) : activeStep === 'reflection' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label={save.isPending ? 'Saving…' : 'Save check-in'}
          disabled={save.isPending || !mood || emotions.length < config.min_emotions}
          loading={save.isPending}
          onPress={onSave}
        />
        <TextLink
          label="Back"
          onPress={() => {
            if (!save.isPending) setStep('emotions');
          }}
        />
      </View>
    ) : null;

  return (
    <CustomerPage
      onBack={goBack}
      dismissKeyboardOnDrag
      footer={footer}
      right={
        activeStep !== 'success' ? (
          <IconButton
            icon="time-outline"
            label="Mood history"
            onPress={() =>
              router.push({ pathname: '/account/tool-history', params: { kind: 'moods' } })
            }
          />
        ) : undefined
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <IntroArt compact={activeStep !== 'mood'} />
        <ToolProgress steps={[...STEPS]} current={activeStep} />

        {activeStep === 'mood' ? (
          <FadeInView key="mood" style={styles.step}>
            <ToolStepHeader
              title="How are you feeling today?"
              body="Take a moment to check in with yourself."
            />
            <View style={styles.moodGrid}>
              {config.moods.map((option, index) => (
                <MoodCard
                  key={option.key}
                  label={option.label}
                  caption={option.caption}
                  moodKey={option.key}
                  tone={option.tone}
                  selected={mood === option.key}
                  delayMs={reduceMotion ? 0 : index * 40}
                  onPress={() => setMood(option.key)}
                />
              ))}
            </View>
          </FadeInView>
        ) : null}

        {activeStep === 'emotions' ? (
          <FadeInView key="emotions" style={styles.step}>
            <ToolStepHeader
              title="What emotions are you noticing?"
              body={`Choose ${config.min_emotions}–${config.max_emotions} that fit right now.`}
            />
            {selectedMood ? (
              <View style={styles.selectedMoodChip}>
                <MoodFace moodKey={selectedMood.key} tone={selectedMood.tone} size={28} />
                <Text style={styles.selectedMoodText}>{selectedMood.label}</Text>
              </View>
            ) : null}
            {config.emotion_groups.map((group) => (
              <View key={group.tone} style={styles.group}>
                <Text style={[styles.groupLabel, { color: TONE[group.tone].ink }]}>
                  {GROUP_LABEL[group.tone]}
                </Text>
                <View style={styles.chipWrap}>
                  {group.emotions.map((emotion) => {
                    const on = emotions.includes(emotion.key);
                    return (
                      <EmotionChip
                        key={emotion.key}
                        label={emotion.label}
                        tone={group.tone}
                        selected={on}
                        onPress={() => toggleEmotion(emotion.key, config.max_emotions)}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
            <Text style={styles.count}>
              {emotions.length} of {config.max_emotions} selected
            </Text>
            {limitHint ? (
              <Text style={styles.limitHint} accessibilityLabel={`You can choose up to ${config.max_emotions} emotions.`}>
                You can choose up to {config.max_emotions} emotions.
              </Text>
            ) : null}
          </FadeInView>
        ) : null}

        {activeStep === 'reflection' ? (
          <FadeInView key="reflection" style={styles.step}>
            <ToolStepHeader
              title="Would you like to share more?"
              body="Optional. A few words can help you notice patterns over time."
            />
            <View style={styles.writeCard}>
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                maxLength={config.reflection_max}
                placeholder="Write anything on your mind…"
                placeholderTextColor={customer.muted}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Reflection, optional"
                style={styles.area}
              />
              <Text style={styles.counter}>
                {reflection.length} / {config.reflection_max}
              </Text>
            </View>
            {errorMessage ? (
              <View style={styles.errorBox} accessibilityLabel={errorMessage}>
                <Ionicons name="alert-circle" size={18} color={customer.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </FadeInView>
        ) : null}

        {activeStep === 'success' && save.data ? (
          <SuccessPanel
            moodLabel={save.data.entry.mood_label ?? selectedMood?.label ?? 'Mood recorded'}
            emotions={save.data.entry.emotions.map((item) => item.label)}
            created={save.data.created}
            onAgain={restart}
          />
        ) : null}
      </KeyboardAvoidingView>
    </CustomerPage>
  );
}

function IntroArt({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.introArt, compact && styles.introArtCompact]}>
      <BrandGradient
        colors={[customer.mint, customer.lavender, customer.cream]}
        angle={150}
        style={StyleSheet.absoluteFill}
      />
      <RemoteImage
        uri={resolveImageUrl(ILLUSTRATION)}
        resizeMode="contain"
        background="transparent"
        label="Daily Mood Check-in"
        style={compact ? styles.introImageCompact : styles.introImage}
      />
    </View>
  );
}

function MoodCard({
  label,
  caption,
  moodKey,
  tone,
  selected,
  delayMs,
  onPress,
}: {
  label: string;
  caption: string;
  moodKey: string;
  tone: MoodTone;
  selected: boolean;
  delayMs: number;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = selected ? 1.02 : 1;
      return;
    }
    scale.value = withSpring(selected ? 1.03 : 1, motion.spring.soft);
  }, [reduceMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <FadeInView delayMs={delayMs} offsetY={10} style={styles.moodCardWrap}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${caption}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        scaleTo={0.97}
        style={[styles.moodCard, selected && styles.moodCardOn, { borderColor: selected ? TONE[tone].ink : customer.line }]}
      >
        <Animated.View style={[styles.moodCardInner, animatedStyle]}>
          <View style={[styles.faceWell, { backgroundColor: TONE[tone].soft }]}>
            <MoodFace moodKey={moodKey} tone={tone} size={52} />
          </View>
          <View style={styles.moodCopy}>
            <Text style={styles.moodLabel}>{label}</Text>
            <Text style={styles.moodCaption} numberOfLines={2}>
              {caption}
            </Text>
          </View>
          {selected ? (
            <Ionicons name="checkmark-circle" size={22} color={customer.teal} />
          ) : (
            <View style={styles.radio} />
          )}
        </Animated.View>
      </PressableScale>
    </FadeInView>
  );
}

function EmotionChip({
  label,
  tone,
  selected,
  onPress,
}: {
  label: string;
  tone: MoodTone;
  selected: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    if (selected) {
      scale.value = withSequence(
        withTiming(1.06, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withSpring(1, motion.spring.snappy),
      );
    }
  }, [reduceMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      scaleTo={0.96}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && {
            backgroundColor: TONE[tone].bg,
            borderColor: TONE[tone].ink,
          },
          animatedStyle,
        ]}
      >
        <Text style={[styles.chipText, selected && { color: TONE[tone].ink }]}>{label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

function SuccessPanel({
  moodLabel,
  emotions,
  created,
  onAgain,
}: {
  moodLabel: string;
  emotions: string[];
  created: boolean;
  onAgain: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  return (
    <FadeInView style={styles.step}>
      <Animated.View style={[styles.successCard, animatedStyle]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={42} color={customer.teal} />
        </View>
        <Text style={styles.successTitle} accessibilityRole="header">
          Check-in saved
        </Text>
        <View style={styles.savedTag}>
          <Ionicons name="cloud-done-outline" size={14} color={customer.teal} />
          <Text style={styles.savedTagText}>Saved to your account</Text>
        </View>
        <Text style={styles.successMood}>{moodLabel}</Text>
        {emotions.length > 0 ? (
          <Text style={styles.successEmotions}>{emotions.join(' · ')}</Text>
        ) : null}
        {!created ? (
          <Text style={styles.retryNote}>This was already saved — nothing was duplicated.</Text>
        ) : null}
        <Text style={styles.successMeta}>
          It now shows in My Progress, Reports and on the website.
        </Text>
        <PrimaryAction label="See My Progress" onPress={() => router.push('/progress')} />
        <TextLink label="Write Another" onPress={onAgain} />
      </Animated.View>
    </FadeInView>
  );
}

function PrimaryAction({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={[styles.primary, inactive && styles.primaryDisabled]}
    >
      {loading ? <ActivityIndicator color={customer.white} /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </PressableScale>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.linkBtn}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

function StateCard({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={22} color={customer.teal} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      <PrimaryAction label={action} onPress={onAction} />
    </View>
  );
}

/** Kept so AccountTools can still export a stable mood entry point if needed. */
export type MoodConfig = PsychologyOptions['mood'];

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 14 },
  step: { gap: 14, marginTop: 4 },
  footerStack: { gap: 10 },

  introArt: {
    height: 148,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  introArtCompact: { height: 88 },
  introImage: { width: '72%', height: 120 },
  introImageCompact: { width: '46%', height: 72 },

  moodGrid: { gap: 10 },
  moodCardWrap: { width: '100%' },
  moodCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: customer.white,
    ...shadows.sm,
  },
  moodCardOn: {
    backgroundColor: customer.cream,
    ...shadows.md,
  },
  moodCardInner: {
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faceWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCopy: { flex: 1, gap: 2 },
  moodLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: customer.navy,
  },
  moodCaption: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: customer.body,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: customer.line,
  },

  selectedMoodChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: customer.mint,
  },
  selectedMoodText: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: customer.tealDark,
  },

  group: { gap: 8 },
  groupLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: customer.line,
    backgroundColor: customer.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: customerFonts.medium,
    fontSize: 14,
    color: customer.navy,
  },
  count: {
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: customer.muted,
  },
  limitHint: {
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: customer.danger,
  },

  writeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 14,
    gap: 8,
    ...shadows.sm,
  },
  area: {
    minHeight: 150,
    fontFamily: customerFonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: customer.navy,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: customer.muted,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FDECEE',
  },
  errorText: {
    flex: 1,
    fontFamily: customerFonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: customer.danger,
  },

  successCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 22,
    gap: 10,
    alignItems: 'center',
    ...shadows.md,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: customer.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 24,
    color: customer.navy,
    letterSpacing: -0.3,
  },
  savedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: customer.mint,
  },
  savedTagText: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    color: customer.tealDark,
  },
  successMood: {
    fontFamily: customerFonts.bold,
    fontSize: 17,
    color: customer.navy,
    marginTop: 4,
  },
  successEmotions: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.body,
    textAlign: 'center',
  },
  retryNote: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: customer.muted,
    textAlign: 'center',
  },
  successMeta: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: customer.muted,
    textAlign: 'center',
    marginBottom: 6,
  },

  primary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: customer.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    ...shadows.brand,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: customer.white,
  },
  linkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: customer.teal,
  },

  state: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 20,
    gap: 8,
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
  stateTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 17,
    color: customer.navy,
  },
  stateBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.body,
    marginBottom: 8,
  },
});
