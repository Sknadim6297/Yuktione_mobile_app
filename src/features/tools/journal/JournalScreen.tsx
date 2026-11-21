import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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
import { RemoteImage } from '@/features/customer/home/media';
import {
  newCompletionKey,
  useAccountScope,
  usePsychologyOptions,
  useSaveEntry,
} from '@/features/customer/myspace/accountData';
import { SignInToSave } from '@/features/customer/myspace/AccountTools';
import { CustomerPage, IconButton } from '@/features/customer/ui';
import { ToolProgress } from '@/features/tools/chrome/ToolProgress';
import { ToolStepHeader } from '@/features/tools/chrome/ToolStepHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { saveJournalEntry } from '@/services/api/mySpace';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customer, customerFonts, motion, shadows } from '@/theme';

type Step = 'welcome' | 'prompt' | 'write' | 'success';

const STEPS = [
  { id: 'welcome', label: 'Start' },
  { id: 'prompt', label: 'Prompt' },
  { id: 'write', label: 'Write' },
  { id: 'success', label: 'Done' },
] as const;

const ILLUSTRATION = 'frontend/assets/img/tools-illustrations/digital-journal-3d.webp';

/** Soft accent pairs for the six website prompts — icons only, no emoji. */
const PROMPT_VISUAL: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string; ink: string }> = {
  'my-thoughts': { icon: 'chatbubble-ellipses-outline', tint: customer.mint, ink: customer.tealDark },
  'personal-growth': { icon: 'trending-up-outline', tint: customer.lavender, ink: customer.lavenderInk },
  'work-career': { icon: 'briefcase-outline', tint: customer.blue, ink: customer.blueInk },
  relationships: { icon: 'heart-outline', tint: customer.pink, ink: customer.pinkInk },
  'difficult-moments': { icon: 'rainy-outline', tint: customer.gold, ink: customer.goldInk },
  'my-aspirations': { icon: 'sparkles-outline', tint: customer.peach, ink: customer.peachInk },
};

function goBackHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

export function JournalScreen() {
  const account = useAccountScope();
  const options = usePsychologyOptions();
  const save = useSaveEntry(saveJournalEntry);
  const reduceMotion = useReducedMotion();

  const [key, setKey] = useState(newCompletionKey);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [step, setStep] = useState<Step>('welcome');
  const [focused, setFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const config = options.data?.journal;
  const selected = useMemo(
    () => config?.prompts.find((item) => item.key === prompt) ?? null,
    [config, prompt],
  );

  const dirty = Boolean(title.trim() || body.trim() || prompt);
  const activeStep: Step = save.data ? 'success' : step;

  const restart = () => {
    setKey(newCompletionKey());
    setPrompt(null);
    setTitle('');
    setBody('');
    setStep('welcome');
    setFocused(false);
    setErrorMessage(null);
    save.reset();
  };

  const leaveSafely = () => {
    if (activeStep === 'success' || !dirty || save.isPending) {
      goBackHome();
      return;
    }
    Alert.alert('Leave without saving?', 'Your unfinished writing stays only on this screen until you save.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: goBackHome },
    ]);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      leaveSafely();
      return true;
    });
    return () => sub.remove();
  });

  const onSave = () => {
    if (!prompt || !config || save.isPending) return;
    const trimmed = body.trim();
    if (!trimmed) {
      setErrorMessage('Write a few words before saving.');
      return;
    }
    setErrorMessage(null);
    save.mutate(
      {
        completion_key: key,
        prompt_key: prompt,
        title: title.trim() || undefined,
        body: trimmed,
      },
      {
        onError: (error) => {
          setErrorMessage(error.message || 'Nothing was saved. You can try again.');
        },
      },
    );
  };

  if (!account.enabled) {
    return (
      <CustomerPage onBack={goBackHome}>
        <IntroArt />
        <ToolStepHeader
          eyebrow="Digital Journal"
          title="A Space for Your Thoughts"
          body="Your words, your pace, your space."
        />
        <SignInToSave what="journal entry" />
      </CustomerPage>
    );
  }

  if (options.isLoading) {
    return (
      <CustomerPage onBack={goBackHome}>
        <ActivityIndicator color={customer.teal} style={{ marginTop: 40 }} />
      </CustomerPage>
    );
  }

  if (options.isError || !config) {
    return (
      <CustomerPage onBack={goBackHome}>
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
      <CustomerPage onBack={goBackHome}>
        <StateCard
          icon="pause-circle-outline"
          title="Not available right now"
          body="This tool has been paused on YuktiOne. Please check back later."
          action="Back to tools"
          onAction={goBackHome}
        />
      </CustomerPage>
    );
  }

  const hideChrome = activeStep === 'write' && focused;
  const footer =
    activeStep === 'welcome' ? (
      <PrimaryAction label="Start Writing" icon="create-outline" onPress={() => setStep('prompt')} />
    ) : activeStep === 'prompt' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label="Continue"
          disabled={!prompt}
          onPress={() => setStep('write')}
        />
        <TextLink label="Back" onPress={() => setStep('welcome')} />
      </View>
    ) : activeStep === 'write' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label={save.isPending ? 'Saving…' : 'Save Entry'}
          disabled={save.isPending || !prompt || !body.trim()}
          loading={save.isPending}
          onPress={onSave}
        />
        <TextLink
          label="Back"
          onPress={() => {
            if (!save.isPending) {
              setFocused(false);
              setStep('prompt');
            }
          }}
        />
      </View>
    ) : null;

  return (
    <CustomerPage
      onBack={leaveSafely}
      dismissKeyboardOnDrag
      footer={footer}
      right={
        activeStep !== 'success' ? (
          <IconButton
            icon="time-outline"
            label="Journal history"
            onPress={() =>
              router.push({ pathname: '/account/tool-history', params: { kind: 'journal' } })
            }
          />
        ) : undefined
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {!hideChrome ? <IntroArt compact={activeStep !== 'welcome'} /> : null}
        {!hideChrome ? <ToolProgress steps={[...STEPS]} current={activeStep} /> : null}

        {activeStep === 'welcome' ? (
          <FadeInView key="welcome" style={styles.step}>
            <ToolStepHeader
              title="A Space for Your Thoughts"
              body="Your words, your pace, your space."
            />
            <View style={styles.welcomeNote}>
              <Ionicons name="lock-closed-outline" size={16} color={customer.teal} />
              <Text style={styles.welcomeNoteText}>
                Entries save to your YuktiOne account. They stay private to you.
              </Text>
            </View>
          </FadeInView>
        ) : null}

        {activeStep === 'prompt' ? (
          <FadeInView key="prompt" style={styles.step}>
            <ToolStepHeader
              title="What's on your mind?"
              body="Choose a prompt to guide your writing."
            />
            <View style={styles.promptList}>
              {config.prompts.map((item, index) => (
                <PromptCard
                  key={item.key}
                  label={item.label}
                  question={item.question}
                  promptKey={item.key}
                  selected={prompt === item.key}
                  delayMs={reduceMotion ? 0 : index * 35}
                  onPress={() => setPrompt(item.key)}
                />
              ))}
            </View>
          </FadeInView>
        ) : null}

        {activeStep === 'write' ? (
          <FadeInView key="write" style={styles.step}>
            {!hideChrome ? (
              <ToolStepHeader
                title="Writing studio"
                body="Write freely. You can edit the title anytime."
              />
            ) : null}
            {selected ? (
              <View style={styles.promptBanner}>
                <Ionicons
                  name={(PROMPT_VISUAL[selected.key] ?? PROMPT_VISUAL['my-thoughts']!).icon}
                  size={16}
                  color={customer.tealDark}
                />
                <View style={styles.grow}>
                  <Text style={styles.promptBannerLabel}>{selected.label}</Text>
                  {selected.question ? (
                    <Text style={styles.promptBannerQuestion} numberOfLines={hideChrome ? 1 : 3}>
                      {selected.question}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
            <View style={[styles.paper, hideChrome && styles.paperFocus]}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                maxLength={config.title_max}
                placeholder="Title (optional)"
                placeholderTextColor={customer.muted}
                accessibilityLabel="Journal title, optional"
                style={styles.titleInput}
                onFocus={() => setFocused(true)}
              />
              <View style={styles.paperRule} />
              <TextInput
                value={body}
                onChangeText={setBody}
                maxLength={config.body_max}
                placeholder="Start writing…"
                placeholderTextColor={customer.muted}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Journal body"
                style={[styles.bodyInput, hideChrome && styles.bodyInputFocus]}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <View style={styles.counters}>
                <Text style={styles.counter}>
                  Title {title.length}/{config.title_max}
                </Text>
                <Text style={styles.counter}>
                  {body.length}/{config.body_max}
                </Text>
              </View>
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
            title={save.data.entry.title}
            promptLabel={save.data.entry.prompt_label}
            created={save.data.created}
            onAgain={() => {
              restart();
              setStep('prompt');
            }}
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
        colors={[customer.lavender, customer.mint, customer.cream]}
        angle={145}
        style={StyleSheet.absoluteFill}
      />
      <RemoteImage
        uri={resolveImageUrl(ILLUSTRATION)}
        resizeMode="contain"
        background="transparent"
        label="Digital Journal"
        style={compact ? styles.introImageCompact : styles.introImage}
      />
    </View>
  );
}

function PromptCard({
  label,
  question,
  promptKey,
  selected,
  delayMs,
  onPress,
}: {
  label: string;
  question: string | null;
  promptKey: string;
  selected: boolean;
  delayMs: number;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const visual = PROMPT_VISUAL[promptKey] ?? PROMPT_VISUAL['my-thoughts']!;

  useEffect(() => {
    if (reduceMotion) {
      scale.value = selected ? 1.02 : 1;
      return;
    }
    scale.value = withSpring(selected ? 1.02 : 1, motion.spring.soft);
  }, [reduceMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <FadeInView delayMs={delayMs} offsetY={10} style={styles.promptWrap}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label}${question ? `. ${question}` : ''}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        scaleTo={0.97}
        style={[styles.promptCard, selected && styles.promptCardOn]}
      >
        <Animated.View style={[styles.promptInner, animatedStyle]}>
          <View style={[styles.promptIcon, { backgroundColor: visual.tint }]}>
            <Ionicons name={visual.icon} size={22} color={visual.ink} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.promptLabel}>{label}</Text>
            {question ? (
              <Text style={styles.promptQuestion} numberOfLines={2}>
                {question}
              </Text>
            ) : null}
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

function SuccessPanel({
  title,
  promptLabel,
  created,
  onAgain,
}: {
  title: string | null;
  promptLabel: string | null;
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
    progress.value = withSequence(
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <FadeInView style={styles.step}>
      <Animated.View style={[styles.successCard, animatedStyle]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={42} color={customer.teal} />
        </View>
        <Text style={styles.successTitle} accessibilityRole="header">
          Your Thoughts Are Saved
        </Text>
        <View style={styles.savedTag}>
          <Ionicons name="cloud-done-outline" size={14} color={customer.teal} />
          <Text style={styles.savedTagText}>Saved to your account</Text>
        </View>
        <Text style={styles.successBody}>
          Your journal entry has been saved to your account.
        </Text>
        {title ? <Text style={styles.successMetaTitle}>{title}</Text> : null}
        {promptLabel ? <Text style={styles.successMeta}>{promptLabel}</Text> : null}
        {!created ? (
          <Text style={styles.retryNote}>This was already saved — nothing was duplicated.</Text>
        ) : null}
        <PrimaryAction label="View My Progress" onPress={() => router.push('/progress')} />
        <TextLink label="Write Another" onPress={onAgain} />
        <TextLink label="Back to Tools" onPress={() => router.replace('/(tabs)/tools')} />
      </Animated.View>
    </FadeInView>
  );
}

function PrimaryAction({
  label,
  onPress,
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
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
      {!loading && icon ? <Ionicons name={icon} size={18} color={customer.white} /> : null}
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

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 14 },
  step: { gap: 14, marginTop: 4 },
  footerStack: { gap: 10 },
  grow: { flex: 1, gap: 2 },

  introArt: {
    height: 156,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  introArtCompact: { height: 88 },
  introImage: { width: '72%', height: 128 },
  introImageCompact: { width: '48%', height: 72 },

  welcomeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: customer.mint,
  },
  welcomeNoteText: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.body,
  },

  promptList: { gap: 10 },
  promptWrap: { width: '100%' },
  promptCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: customer.line,
    backgroundColor: customer.white,
    ...shadows.sm,
  },
  promptCardOn: {
    borderColor: customer.teal,
    backgroundColor: customer.cream,
    ...shadows.md,
  },
  promptInner: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promptIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: customer.navy,
  },
  promptQuestion: {
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

  promptBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: customer.lavender,
  },
  promptBannerLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: customer.tealDark,
  },
  promptBannerQuestion: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: customer.body,
  },

  paper: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 16,
    gap: 10,
    ...shadows.sm,
  },
  paperFocus: {
    borderColor: customer.teal,
    ...shadows.md,
  },
  titleInput: {
    fontFamily: customerFonts.bold,
    fontSize: 18,
    color: customer.navy,
    paddingVertical: 4,
  },
  paperRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: customer.line,
  },
  bodyInput: {
    minHeight: 180,
    fontFamily: customerFonts.regular,
    fontSize: 16,
    lineHeight: 26,
    color: customer.navy,
  },
  bodyInputFocus: { minHeight: 260 },
  counters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  counter: {
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
    textAlign: 'center',
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
  successBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.body,
    textAlign: 'center',
  },
  successMetaTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: customer.navy,
    textAlign: 'center',
  },
  successMeta: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: customer.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  retryNote: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: customer.muted,
    textAlign: 'center',
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
