import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
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
import { saveGratitudeEntry } from '@/services/api/mySpace';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customerFonts, motion, shadows, toolPalette } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Step = 'welcome' | 'cards' | 'review' | 'success';

const STEPS = [
  { id: 'welcome', label: 'Start' },
  { id: 'cards', label: 'Cards' },
  { id: 'review', label: 'Review' },
  { id: 'success', label: 'Done' },
] as const;

const ILLUSTRATION = 'frontend/assets/img/tools-illustrations/mindfulness-calm-3d.webp';

const CARD_VISUAL: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string; ink: string }> = {
  'something-good-today': { icon: 'sunny-outline', tint: '#FFF6DE', ink: '#B8860B' },
  'someone-i-appreciate': { icon: 'heart-outline', tint: toolPalette.lavender, ink: toolPalette.lavenderInk },
  'something-about-myself': { icon: 'sparkles-outline', tint: toolPalette.mint, ink: toolPalette.tealDark },
};

function goBackHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

function answeredEntries(answers: Record<string, string>): [string, string][] {
  return Object.entries(answers)
    .map(([key, value]) => [key, value.trim()] as [string, string])
    .filter(([, value]) => value.length > 0);
}

export function GratitudeScreen() {
  const account = useAccountScope();
  const options = usePsychologyOptions();
  const save = useSaveEntry(saveGratitudeEntry);
  const reduceMotion = useReducedMotion();

  const [key, setKey] = useState(newCompletionKey);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('welcome');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const config = options.data?.gratitude;
  const filled = useMemo(() => answeredEntries(answers), [answers]);
  const answeredCount = filled.length;
  const dirty = answeredCount > 0;
  const activeStep: Step = save.data ? 'success' : step;
  const canContinue = Boolean(config && answeredCount >= config.min_answered);

  const restart = () => {
    setKey(newCompletionKey());
    setAnswers({});
    setExpanded(null);
    setStep('welcome');
    setErrorMessage(null);
    save.reset();
  };

  const leaveSafely = () => {
    if (activeStep === 'success' || !dirty || save.isPending) {
      goBackHome();
      return;
    }
    Alert.alert('Leave without saving?', 'Your unfinished gratitude stays only on this screen until you save.', [
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
    if (!config || save.isPending || !canContinue) return;
    setErrorMessage(null);
    save.mutate(
      {
        completion_key: key,
        answers: Object.fromEntries(filled),
      },
      {
        onError: (error) => {
          setErrorMessage(error.message || 'Nothing was saved. You can try again.');
        },
      },
    );
  };

  const setAnswer = (cardKey: string, value: string) => {
    setAnswers((current) => ({ ...current, [cardKey]: value }));
  };

  const toggleCard = (cardKey: string) => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((current) => (current === cardKey ? null : cardKey));
  };

  if (!account.enabled) {
    return (
      <CustomerPage onBack={goBackHome}>
        <IntroArt />
        <ToolStepHeader
          eyebrow="Gratitude Journal"
          title="Find Joy in the Little Things"
          body="Take a moment to appreciate what matters."
          accent={toolPalette.tealDark}
          ink={toolPalette.navy}
        />
        <SignInToSave what="gratitude entry" />
      </CustomerPage>
    );
  }

  if (options.isLoading) {
    return (
      <CustomerPage onBack={goBackHome}>
        <ActivityIndicator color={toolPalette.teal} style={{ marginTop: 40 }} />
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

  const footer =
    activeStep === 'welcome' ? (
      <PrimaryAction label="Start Gratitude" icon="leaf-outline" onPress={() => setStep('cards')} />
    ) : activeStep === 'cards' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label="Review answers"
          disabled={!canContinue}
          onPress={() => {
            setExpanded(null);
            setStep('review');
          }}
        />
        <Text style={styles.footerHint}>
          Answer at least {config.min_answered}. Empty cards are skipped.
        </Text>
        <TextLink label="Back" onPress={() => setStep('welcome')} />
      </View>
    ) : activeStep === 'review' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label={save.isPending ? 'Saving…' : 'Save Gratitude'}
          disabled={save.isPending || !canContinue}
          loading={save.isPending}
          onPress={onSave}
        />
        <TextLink
          label="Edit answers"
          onPress={() => {
            if (!save.isPending) setStep('cards');
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
            label="Gratitude history"
            onPress={() =>
              router.push({ pathname: '/account/tool-history', params: { kind: 'gratitude' } })
            }
          />
        ) : undefined
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <IntroArt compact={activeStep !== 'welcome'} />
        <ToolProgress
          steps={[...STEPS]}
          current={activeStep}
          accent={toolPalette.teal}
          accentSoft={toolPalette.mintDeep}
          ink={toolPalette.navy}
        />

        {activeStep === 'welcome' ? (
          <FadeInView key="welcome" style={styles.step}>
            <ToolStepHeader
              title="Find Joy in the Little Things"
              body="Take a moment to appreciate what matters."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.welcomeNote}>
              <Ionicons name="lock-closed-outline" size={16} color={toolPalette.teal} />
              <Text style={styles.welcomeNoteText}>
                Reflections save to your YuktiOne account. They stay private to you.
              </Text>
            </View>
          </FadeInView>
        ) : null}

        {activeStep === 'cards' ? (
          <FadeInView key="cards" style={styles.step}>
            <ToolStepHeader
              title="What are you grateful for today?"
              body="Write in any card. Skip the ones you want to leave blank."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.cardList}>
              {config.cards.map((card, index) => (
                <GratitudeCard
                  key={card.key}
                  promptKey={card.key}
                  label={card.label}
                  question={card.question}
                  hint={card.hint}
                  value={answers[card.key] ?? ''}
                  maxLength={config.answer_max}
                  expanded={expanded === card.key || Boolean((answers[card.key] ?? '').trim())}
                  delayMs={reduceMotion ? 0 : index * 40}
                  onToggle={() => toggleCard(card.key)}
                  onChange={(value) => setAnswer(card.key, value)}
                  onFocus={() => setExpanded(card.key)}
                />
              ))}
            </View>
            {errorMessage ? (
              <View style={styles.errorBox} accessibilityLabel={errorMessage}>
                <Ionicons name="alert-circle" size={18} color={toolPalette.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </FadeInView>
        ) : null}

        {activeStep === 'review' ? (
          <FadeInView key="review" style={styles.step}>
            <ToolStepHeader
              title="A Moment of Appreciation"
              body="Only answered cards will be saved. You can edit before submitting."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.cardList}>
              {config.cards
                .filter((card) => (answers[card.key] ?? '').trim())
                .map((card) => (
                  <View key={card.key} style={styles.reviewCard}>
                    <View style={styles.reviewHead}>
                      <Ionicons
                        name={(CARD_VISUAL[card.key] ?? CARD_VISUAL['something-good-today']!).icon}
                        size={18}
                        color={toolPalette.tealDark}
                      />
                      <Text style={styles.reviewLabel}>{card.label}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${card.label}`}
                        onPress={() => {
                          setExpanded(card.key);
                          setStep('cards');
                        }}
                        hitSlop={8}
                      >
                        <Text style={styles.editLink}>Edit</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.reviewBody}>{(answers[card.key] ?? '').trim()}</Text>
                  </View>
                ))}
            </View>
            {errorMessage ? (
              <View style={styles.errorBox} accessibilityLabel={errorMessage}>
                <Ionicons name="alert-circle" size={18} color={toolPalette.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </FadeInView>
        ) : null}

        {activeStep === 'success' && save.data ? (
          <SuccessPanel
            answers={save.data.entry.answers}
            created={save.data.created}
            onAgain={() => {
              restart();
              setStep('cards');
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
        colors={[toolPalette.lavender, toolPalette.mint, toolPalette.cream]}
        angle={145}
        style={StyleSheet.absoluteFill}
      />
      <RemoteImage
        uri={resolveImageUrl(ILLUSTRATION)}
        resizeMode="contain"
        background="transparent"
        label="Gratitude Journal"
        style={compact ? styles.introImageCompact : styles.introImage}
      />
    </View>
  );
}

function GratitudeCard({
  promptKey,
  label,
  question,
  hint,
  value,
  maxLength,
  expanded,
  delayMs,
  onToggle,
  onChange,
  onFocus,
}: {
  promptKey: string;
  label: string;
  question: string | null;
  hint: string | null;
  value: string;
  maxLength: number;
  expanded: boolean;
  delayMs: number;
  onToggle: () => void;
  onChange: (value: string) => void;
  onFocus: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const completed = Boolean(value.trim());
  const visual = CARD_VISUAL[promptKey] ?? CARD_VISUAL['something-good-today']!;
  const { icon, tint, ink } = visual;

  useEffect(() => {
    if (reduceMotion) {
      scale.value = completed ? 1.01 : 1;
      return;
    }
    scale.value = withSpring(completed ? 1.01 : 1, motion.spring.soft);
  }, [completed, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <FadeInView delayMs={delayMs} offsetY={10} style={styles.cardWrap}>
      <Animated.View style={[styles.card, completed && styles.cardDone, animatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.cardHeader}
        >
          <View style={[styles.cardIcon, { backgroundColor: tint }]}>
            <Ionicons name={icon} size={22} color={ink} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.cardLabel}>{label}</Text>
            {question ? (
              <Text style={styles.cardQuestion} numberOfLines={expanded ? 3 : 2}>
                {question}
              </Text>
            ) : null}
          </View>
          {completed ? (
            <Ionicons name="checkmark-circle" size={22} color={toolPalette.teal} />
          ) : (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={toolPalette.muted}
            />
          )}
        </Pressable>
        {expanded ? (
          <View style={styles.cardBody}>
            {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
            <TextInput
              value={value}
              onChangeText={onChange}
              maxLength={maxLength}
              placeholder="Write here, or leave blank to skip"
              placeholderTextColor={toolPalette.muted}
              multiline
              textAlignVertical="top"
              accessibilityLabel={`${label} answer`}
              style={styles.cardInput}
              onFocus={onFocus}
            />
            <Text style={styles.counter}>
              {value.length}/{maxLength}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </FadeInView>
  );
}

function SuccessPanel({
  answers,
  created,
  onAgain,
}: {
  answers: { key: string; label: string; excerpt: string }[];
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
          <Ionicons name="checkmark-circle" size={42} color={toolPalette.teal} />
        </View>
        <Text style={styles.successTitle} accessibilityRole="header">
          Your Gratitude Is Saved
        </Text>
        <View style={styles.savedTag}>
          <Ionicons name="cloud-done-outline" size={14} color={toolPalette.teal} />
          <Text style={styles.savedTagText}>Saved to your account</Text>
        </View>
        <Text style={styles.successBody}>Your reflections have been saved to your account.</Text>
        {answers.slice(0, 3).map((item) => (
          <Text key={item.key} style={styles.successMeta} numberOfLines={2}>
            {item.label}: {item.excerpt}
          </Text>
        ))}
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
      {loading ? <ActivityIndicator color={toolPalette.white} /> : null}
      {!loading && icon ? <Ionicons name={icon} size={18} color={toolPalette.white} /> : null}
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
        <Ionicons name={icon} size={22} color={toolPalette.teal} />
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
  footerHint: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
    textAlign: 'center',
  },
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
    backgroundColor: toolPalette.mint,
  },
  welcomeNoteText: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: toolPalette.body,
  },

  cardList: { gap: 12 },
  cardWrap: { width: '100%' },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardDone: {
    borderColor: toolPalette.teal,
    backgroundColor: toolPalette.cream,
  },
  cardHeader: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: toolPalette.navy,
  },
  cardQuestion: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: toolPalette.body,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: toolPalette.line,
  },
  cardHint: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
    marginTop: 10,
  },
  cardInput: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: toolPalette.navy,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
  },

  reviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 14,
    gap: 8,
    ...shadows.sm,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewLabel: {
    flex: 1,
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: toolPalette.navy,
  },
  editLink: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: toolPalette.teal,
  },
  reviewBody: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: toolPalette.body,
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
    color: toolPalette.danger,
  },

  successCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 22,
    gap: 10,
    alignItems: 'center',
    ...shadows.md,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: toolPalette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 24,
    color: toolPalette.navy,
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
    backgroundColor: toolPalette.mint,
  },
  savedTagText: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    color: toolPalette.tealDark,
  },
  successBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: toolPalette.body,
    textAlign: 'center',
  },
  successMeta: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: toolPalette.muted,
    textAlign: 'center',
  },
  retryNote: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
    textAlign: 'center',
  },

  primary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: toolPalette.teal,
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
    color: toolPalette.white,
  },
  linkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: toolPalette.teal,
  },

  state: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 20,
    gap: 8,
  },
  stateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: toolPalette.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 17,
    color: toolPalette.navy,
  },
  stateBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: toolPalette.body,
    marginBottom: 8,
  },
});
