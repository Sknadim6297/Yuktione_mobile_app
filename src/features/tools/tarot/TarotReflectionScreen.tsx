import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BrandGradient } from '@/components/brand';
import { FadeInView, PressableScale } from '@/components/motion';
import { RemoteImage } from '@/features/customer/home/media';
import { formatStamp, newCompletionKey, useAccountScope } from '@/features/customer/myspace/accountData';
import { SignInToSave } from '@/features/customer/myspace/AccountTools';
import { CustomerPage, IconButton } from '@/features/customer/ui';
import { ToolProgress } from '@/features/tools/chrome/ToolProgress';
import { ToolStepHeader } from '@/features/tools/chrome/ToolStepHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MySpaceRequestError } from '@/services/api/mySpace';
import {
  fetchTarotFan,
  fetchTarotHistory,
  fetchTarotOptions,
  fetchTarotReading,
  pickTarotCard,
  revealTarotReading,
  saveTarotReading,
  startTarotReading,
  storeTarotCategory,
  storeTarotQuestion,
  storeTarotSpread,
  type TarotCardReveal,
  type TarotFan,
  type TarotReading,
} from '@/services/api/tarotReflection';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customerFonts, shadows, toolPalette } from '@/theme';

type Step = 'welcome' | 'category' | 'question' | 'spread' | 'draw' | 'results' | 'history';

const PROGRESS_STEPS = [
  { id: 'start', label: 'Start' },
  { id: 'ask', label: 'Ask' },
  { id: 'draw', label: 'Draw' },
  { id: 'results', label: 'Results' },
] as const;

const ILLUSTRATION = 'frontend/assets/img/tools-illustrations/tarot-reflection-3d.webp';

function goBackHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

function progressId(step: Step): (typeof PROGRESS_STEPS)[number]['id'] {
  if (step === 'welcome' || step === 'category') return 'start';
  if (step === 'question' || step === 'spread') return 'ask';
  if (step === 'draw') return 'draw';
  if (step === 'results') return 'results';
  return 'start';
}

export function TarotReflectionScreen() {
  const account = useAccountScope();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>('welcome');
  const [completionKey, setCompletionKey] = useState(newCompletionKey);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [spreadKey, setSpreadKey] = useState<string | null>(null);
  const [reversedEnabled, setReversedEnabled] = useState(false);
  const [fan, setFan] = useState<TarotFan | null>(null);
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [savedReadingId, setSavedReadingId] = useState<number | null>(null);
  const [viewReadingId, setViewReadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const optionsQuery = useQuery({
    queryKey: ['v1', 'tarot', 'options'],
    queryFn: () => fetchTarotOptions(),
    retry: (count, error) =>
      !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const options = optionsQuery.data;

  const selectedCategory = useMemo(
    () => options?.categories.find((c) => c.key === categoryKey) ?? null,
    [options, categoryKey],
  );

  const questionMin = options?.question_min ?? 8;
  const questionMax = options?.question_max ?? 400;
  const trimmedQuestion = question.trim();
  const questionValid =
    trimmedQuestion.length >= questionMin && trimmedQuestion.length <= questionMax;

  const historyQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'tarot-history'],
    queryFn: () => fetchTarotHistory(),
    enabled: account.enabled && step === 'history',
  });

  const savedReadingQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'tarot-reading', viewReadingId],
    queryFn: () => fetchTarotReading(viewReadingId!),
    enabled: account.enabled && step === 'results' && viewReadingId !== null,
  });

  const fanQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'tarot-fan', completionKey],
    queryFn: () => fetchTarotFan(completionKey),
    enabled: account.enabled && step === 'draw',
  });

  const displayFan = step === 'draw' ? (fan ?? fanQuery.data ?? null) : null;

  const displayReading =
    viewReadingId !== null && savedReadingQuery.data ? savedReadingQuery.data : reading;

  const startMutation = useMutation({
    mutationFn: () => startTarotReading(completionKey),
    onSuccess: (data) => {
      setErrorMessage(null);
      setCompletionKey(data.completion_key);
      setStep('category');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not start a reading.');
    },
  });

  const categoryMutation = useMutation({
    mutationFn: (category: string) =>
      storeTarotCategory({ completion_key: completionKey, category }),
    onSuccess: () => {
      setErrorMessage(null);
      setStep('question');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save your focus.');
    },
  });

  const questionMutation = useMutation({
    mutationFn: (text: string) =>
      storeTarotQuestion({ completion_key: completionKey, question: text }),
    onSuccess: (data) => {
      setErrorMessage(null);
      setQuestion(data.question);
      setStep('spread');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save your question.');
    },
  });

  const spreadMutation = useMutation({
    mutationFn: () =>
      storeTarotSpread({
        completion_key: completionKey,
        spread_type: spreadKey!,
        reversed_enabled: reversedEnabled,
      }),
    onSuccess: () => {
      setErrorMessage(null);
      setFan(null);
      setStep('draw');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save your spread.');
    },
  });

  const revealMutation = useMutation({
    mutationFn: () => revealTarotReading(completionKey),
    onSuccess: (data) => {
      setErrorMessage(null);
      setReading(data.reading);
      setSavedReadingId(data.saved_reading_id);
      setViewReadingId(null);
      setStep('results');
      setPicking(false);
    },
    onError: (error: Error) => {
      setPicking(false);
      setErrorMessage(error.message || 'Could not reveal your reading.');
    },
  });

  const pickMutation = useMutation({
    mutationFn: (slotToken: string) => {
      const active = fan ?? fanQuery.data;
      if (!active) throw new Error('Draw fan is not ready.');
      return pickTarotCard({
        completion_key: completionKey,
        slot_token: slotToken,
        draw_nonce: active.nonce,
      });
    },
    onSuccess: (data) => {
      setErrorMessage(null);
      setFan(data.fan);
      if (data.complete) {
        revealMutation.mutate();
      } else {
        setPicking(false);
      }
    },
    onError: (error: Error) => {
      setPicking(false);
      setErrorMessage(error.message || 'Could not draw that card.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => saveTarotReading(completionKey),
    networkMode: 'always',
    onSuccess: async (data) => {
      setErrorMessage(null);
      setReading(data.reading);
      setSavedReadingId(data.reading.id ?? null);
      setViewReadingId(null);
      await queryClient.invalidateQueries({
        queryKey: ['v1', 'my', account.userId, 'tarot-history'],
      });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save. You can retry safely.');
    },
  });

  const restart = useCallback(() => {
    setCompletionKey(newCompletionKey());
    setCategoryKey(null);
    setQuestion('');
    setSpreadKey(null);
    setReversedEnabled(options?.reversed_default ?? false);
    setFan(null);
    setReading(null);
    setSavedReadingId(null);
    setViewReadingId(null);
    setErrorMessage(null);
    setPicking(false);
    setStep('welcome');
    startMutation.reset();
    categoryMutation.reset();
    questionMutation.reset();
    spreadMutation.reset();
    pickMutation.reset();
    revealMutation.reset();
    saveMutation.reset();
  }, [
    categoryMutation,
    options?.reversed_default,
    pickMutation,
    questionMutation,
    revealMutation,
    saveMutation,
    spreadMutation,
    startMutation,
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'welcome') {
        goBackHome();
        return true;
      }
      if (step === 'category') {
        setStep('welcome');
        return true;
      }
      if (step === 'question') {
        setStep('category');
        return true;
      }
      if (step === 'spread') {
        setStep('question');
        return true;
      }
      if (step === 'draw') {
        setStep('spread');
        return true;
      }
      if (step === 'results' || step === 'history') {
        setStep('welcome');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const goBack = () => {
    if (step === 'welcome') goBackHome();
    else if (step === 'category') setStep('welcome');
    else if (step === 'question') setStep('category');
    else if (step === 'spread') setStep('question');
    else if (step === 'draw') setStep('spread');
    else setStep('welcome');
  };

  const handlePick = (token: string) => {
    if (!displayFan || picking || pickMutation.isPending || revealMutation.isPending) return;
    if (displayFan.selected_tokens.includes(token)) return;
    setPicking(true);
    setErrorMessage(null);
    pickMutation.mutate(token);
  };

  if (optionsQuery.isLoading) {
    return (
      <CustomerPage onBack={goBackHome}>
        <ActivityIndicator color={toolPalette.teal} style={{ marginTop: 40 }} />
      </CustomerPage>
    );
  }

  if (optionsQuery.isError || !options || !options.open) {
    const closed =
      !options?.open ||
      (optionsQuery.error instanceof MySpaceRequestError && optionsQuery.error.status === 403);
    return (
      <CustomerPage onBack={goBackHome}>
        <StateCard
          icon={closed ? 'pause-circle-outline' : 'cloud-offline-outline'}
          title={closed ? 'Not available right now' : 'Could not load this tool'}
          body={
            closed
              ? 'Tarot Reflection has been paused on YuktiOne. Please check back later.'
              : optionsQuery.error instanceof Error
                ? optionsQuery.error.message
                : 'Check your connection and try again.'
          }
          action={closed ? 'Back to tools' : 'Try again'}
          onAction={closed ? goBackHome : () => void optionsQuery.refetch()}
        />
      </CustomerPage>
    );
  }

  const nextPosition =
    displayFan && displayFan.picked < displayFan.positions.length
      ? (displayFan.positions[displayFan.picked]?.label ?? 'Card')
      : 'Card';

  return (
    <CustomerPage
      onBack={goBack}
      right={
        account.enabled && step === 'welcome' ? (
          <IconButton icon="time-outline" label="History" onPress={() => setStep('history')} />
        ) : undefined
      }
    >
      <IntroArt compact={step !== 'welcome'} />
      {step !== 'history' ? (
        <ToolProgress
          steps={[...PROGRESS_STEPS]}
          current={progressId(step)}
          accent={toolPalette.teal}
          accentSoft={toolPalette.mintDeep}
          ink={toolPalette.navy}
        />
      ) : null}

      {step === 'welcome' ? (
        <FadeInView key="welcome" style={styles.step}>
          <ToolStepHeader
            eyebrow="Tarot Reflection"
            title="A Moment of Reflection"
            body="Explore your thoughts through the symbolism of tarot."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <View style={styles.statRow}>
            <StatChip label="Spreads" value={String(options.spreads.length)} />
            <StatChip label="Duration" value={options.duration_label} />
            <StatChip label="Fan" value={String(options.fan_size)} />
          </View>
          <View style={styles.note}>
            <Ionicons name="moon-outline" size={16} color={toolPalette.teal} />
            <Text style={styles.noteText}>{options.disclaimer}</Text>
          </View>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.howStack}>
            <HowStep
              index={1}
              title="Choose a focus"
              body="Pick the life area you want to explore."
            />
            <HowStep index={2} title="Ask & draw" body="Write one reflective question, then select facedown cards." />
            <HowStep
              index={3}
              title="Reflect"
              body="Read grounded insights and save your reading to revisit later."
            />
          </View>
          {account.enabled ? (
            <PrimaryAction
              label={startMutation.isPending ? 'Starting…' : 'Start a Reading'}
              icon="play"
              loading={startMutation.isPending}
              onPress={() => {
                setErrorMessage(null);
                startMutation.mutate();
              }}
            />
          ) : (
            <>
              <SignInToSave what="tarot reading" />
              <Text style={styles.hint}>You can browse focus areas and spreads. Sign in to draw cards and save.</Text>
            </>
          )}
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          {account.enabled ? (
            <TextLink label="View history" onPress={() => setStep('history')} />
          ) : null}
        </FadeInView>
      ) : null}

      {step === 'category' ? (
        <FadeInView key="category" style={styles.step}>
          <ToolStepHeader
            title="Choose your focus"
            body="Which area of life would you like symbolic reflection on?"
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <View style={styles.categoryStack}>
            {options.categories.map((cat) => {
              const selected = categoryKey === cat.key;
              return (
                <PressableScale
                  key={cat.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setCategoryKey(cat.key)}
                  style={[styles.categoryCard, selected && styles.categoryCardOn]}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <View style={styles.grow}>
                    <Text style={[styles.categoryLabel, selected && styles.categoryLabelOn]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.categoryBlurb}>{cat.blurb}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={toolPalette.teal} />
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          <PrimaryAction
            label={categoryMutation.isPending ? 'Saving…' : 'Continue'}
            loading={categoryMutation.isPending}
            disabled={!categoryKey || categoryMutation.isPending}
            onPress={() => {
              if (!categoryKey) {
                setErrorMessage('Choose a focus to continue.');
                return;
              }
              setErrorMessage(null);
              categoryMutation.mutate(categoryKey);
            }}
          />
          <TextLink label="Back" onPress={() => setStep('welcome')} />
        </FadeInView>
      ) : null}

      {step === 'question' && selectedCategory ? (
        <FadeInView key="question" style={styles.step}>
          <ToolStepHeader
            title="Your question"
            body={`${selectedCategory.emoji} ${selectedCategory.label} — one open, reflective question.`}
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <Text style={styles.fieldLabel}>
            {question.length} / {questionMax} characters (min {questionMin})
          </Text>
          <TextInput
            accessibilityLabel="Your tarot question"
            value={question}
            onChangeText={setQuestion}
            placeholder="What would you like clarity on?"
            placeholderTextColor={toolPalette.muted}
            multiline
            maxLength={questionMax}
            style={styles.questionInput}
            textAlignVertical="top"
          />
          {selectedCategory.examples.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Examples</Text>
              <View style={styles.exampleWrap}>
                {selectedCategory.examples.map((ex) => (
                  <PressableScale
                    key={ex}
                    accessibilityRole="button"
                    accessibilityLabel={`Use example: ${ex}`}
                    onPress={() => setQuestion(ex)}
                    style={styles.exampleChip}
                  >
                    <Text style={styles.exampleText}>{ex}</Text>
                  </PressableScale>
                ))}
              </View>
            </>
          ) : null}
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          <PrimaryAction
            label={questionMutation.isPending ? 'Saving…' : 'Continue'}
            loading={questionMutation.isPending}
            disabled={!questionValid || questionMutation.isPending}
            onPress={() => {
              if (!questionValid) {
                setErrorMessage(
                  trimmedQuestion.length < questionMin
                    ? 'Please enter a clearer question.'
                    : `Keep your question under ${questionMax} characters.`,
                );
                return;
              }
              setErrorMessage(null);
              questionMutation.mutate(trimmedQuestion);
            }}
          />
          <TextLink label="Back" onPress={() => setStep('category')} />
        </FadeInView>
      ) : null}

      {step === 'spread' ? (
        <FadeInView key="spread" style={styles.step}>
          <ToolStepHeader
            title="Choose a spread"
            body="One card for clarity, or three for past · present · pathway."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <View style={styles.spreadStack}>
            {options.spreads.map((spread) => {
              const selected = spreadKey === spread.key;
              return (
                <PressableScale
                  key={spread.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setSpreadKey(spread.key)}
                  style={[styles.spreadCard, selected && styles.spreadCardOn]}
                >
                  <View style={styles.grow}>
                    <Text style={[styles.spreadTitle, selected && styles.spreadTitleOn]}>
                      {spread.label}
                    </Text>
                    <Text style={styles.spreadSubtitle}>{spread.subtitle}</Text>
                    <Text style={styles.spreadMeta}>{spread.count} card{spread.count > 1 ? 's' : ''}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={toolPalette.teal} />
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.grow}>
              <Text style={styles.toggleLabel}>Allow reversed cards</Text>
              <Text style={styles.toggleHint}>Optional; off by default.</Text>
            </View>
            <Switch
              accessibilityRole="switch"
              accessibilityLabel="Allow reversed cards"
              value={reversedEnabled}
              onValueChange={setReversedEnabled}
              trackColor={{ false: toolPalette.line, true: toolPalette.mintDeep }}
              thumbColor={reversedEnabled ? toolPalette.teal : toolPalette.white}
            />
          </View>
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          <PrimaryAction
            label={spreadMutation.isPending ? 'Preparing…' : 'Focus & draw'}
            loading={spreadMutation.isPending}
            disabled={!spreadKey || spreadMutation.isPending}
            onPress={() => {
              if (!spreadKey) {
                setErrorMessage('Choose a spread to continue.');
                return;
              }
              setErrorMessage(null);
              spreadMutation.mutate();
            }}
          />
          <TextLink label="Back" onPress={() => setStep('question')} />
        </FadeInView>
      ) : null}

      {step === 'draw' ? (
        <FadeInView key="draw" style={styles.step}>
          <ToolStepHeader
            title="Focus & draw"
            body="Take a breath. Focus on your question, then choose a facedown card."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          {selectedCategory ? (
            <View style={styles.questionChip}>
              <Text style={styles.questionChipLabel}>{selectedCategory.label}</Text>
              <Text style={styles.questionChipText}>{question}</Text>
            </View>
          ) : null}
          {displayFan ? (
            <View style={styles.drawProgress}>
              <Text style={styles.drawMeta}>
                Drawing <Text style={styles.drawStrong}>{nextPosition}</Text> · {displayFan.picked}{' '}
                of {displayFan.needed} selected
              </Text>
              <View style={styles.positionRow}>
                {displayFan.positions.map((pos, index) => {
                  const done = index < displayFan.picked;
                  const current = index === displayFan.picked;
                  return (
                    <View
                      key={pos.key}
                      style={[
                        styles.positionChip,
                        done && styles.positionDone,
                        current && styles.positionCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.positionText,
                          (done || current) && styles.positionTextOn,
                        ]}
                      >
                        {pos.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
          {fanQuery.isLoading || !displayFan ? (
            <ActivityIndicator color={toolPalette.teal} />
          ) : (
            <View style={styles.fanGrid} accessibilityLabel="Facedown tarot cards">
              {displayFan.tokens.map((token, index) => {
                const picked = displayFan.selected_tokens.includes(token);
                const busy = picking || pickMutation.isPending || revealMutation.isPending;
                return (
                  <PressableScale
                    key={token}
                    accessibilityRole="button"
                    accessibilityLabel={
                      picked
                        ? `Card ${index + 1} already selected`
                        : `Draw facedown card ${index + 1} for ${nextPosition}`
                    }
                    accessibilityState={{ disabled: picked || busy }}
                    disabled={picked || busy}
                    onPress={() => handlePick(token)}
                    style={[
                      styles.facedown,
                      picked && styles.facedownPicked,
                      busy && !picked && styles.facedownBusy,
                    ]}
                  >
                    <View style={styles.facedownMark} />
                    <Text style={styles.facedownHint}>{picked ? 'Selected' : 'Draw'}</Text>
                  </PressableScale>
                );
              })}
            </View>
          )}
          <Text style={styles.hint}>
            Card identities stay hidden until you finish drawing. Selections cannot be changed after
            reveal.
          </Text>
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          {(revealMutation.isPending || pickMutation.isPending) && (
            <View style={styles.revealWait}>
              <ActivityIndicator color={toolPalette.teal} />
              <Text style={styles.hint}>Revealing your reading…</Text>
            </View>
          )}
          <TextLink label="Back" onPress={() => setStep('spread')} />
        </FadeInView>
      ) : null}

      {step === 'results' ? (
        <FadeInView key="results" style={styles.step}>
          <ToolStepHeader
            title={displayReading?.spread_type === 'three' ? 'Your cards' : 'Your card'}
            body={
              displayReading?.category_label
                ? `${displayReading.category_label} · reflective insight, not a prediction.`
                : 'Reflective insight, not a prediction.'
            }
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          {savedReadingQuery.isLoading && viewReadingId ? (
            <ActivityIndicator color={toolPalette.teal} />
          ) : displayReading ? (
            <ResultsBody
              reading={displayReading}
              reduceMotion={reduceMotion || viewReadingId !== null}
            />
          ) : null}
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          {account.enabled && savedReadingId === null && viewReadingId === null && displayReading ? (
            <PrimaryAction
              label={saveMutation.isPending ? 'Saving…' : 'Save to my account'}
              loading={saveMutation.isPending}
              onPress={() => {
                setErrorMessage(null);
                saveMutation.mutate();
              }}
            />
          ) : account.enabled && (savedReadingId !== null || viewReadingId !== null) ? (
            <Text style={styles.savedNote}>Saved to your YuktiOne account</Text>
          ) : null}
          <PrimaryAction label="New reading" onPress={restart} />
          <TextLink label="Back to start" onPress={() => setStep('welcome')} />
        </FadeInView>
      ) : null}

      {step === 'history' ? (
        <FadeInView key="history" style={styles.step}>
          <ToolStepHeader
            title="My readings"
            body="Revisit tarot reflections you saved to your account."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          {!account.enabled ? (
            <SignInToSave what="tarot reading history" />
          ) : historyQuery.isLoading ? (
            <ActivityIndicator color={toolPalette.teal} />
          ) : historyQuery.isError ? (
            <StateCard
              icon="cloud-offline-outline"
              title="Could not load history"
              body={
                historyQuery.error instanceof Error
                  ? historyQuery.error.message
                  : 'Try again.'
              }
              action="Retry"
              onAction={() => void historyQuery.refetch()}
            />
          ) : historyQuery.data?.readings.length === 0 ? (
            <Text style={styles.empty}>No saved readings yet.</Text>
          ) : (
            historyQuery.data?.readings.map((item) => (
              <PressableScale
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setViewReadingId(item.id);
                  setSavedReadingId(item.id);
                  setReading(null);
                  setStep('results');
                }}
                style={styles.historyCard}
              >
                <View style={styles.grow}>
                  <Text style={styles.historyTitle}>
                    {item.category_label} · {item.spread_label}
                  </Text>
                  <Text style={styles.historyQuestion} numberOfLines={2}>
                    {item.question}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.cards_count} card{item.cards_count === 1 ? '' : 's'}
                    {item.created_at ? ` · ${formatStamp(item.created_at)}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={toolPalette.tealDark} />
              </PressableScale>
            ))
          )}
          <TextLink label="Back" onPress={() => setStep('welcome')} />
        </FadeInView>
      ) : null}
    </CustomerPage>
  );
}

function ResultsBody({
  reading,
  reduceMotion,
}: {
  reading: TarotReading;
  reduceMotion: boolean;
}) {
  const isThree = reading.spread_type === 'three';
  return (
    <View style={styles.resultsStack}>
      {reading.question ? (
        <View style={styles.questionChip}>
          <Text style={styles.questionChipLabel}>Your question</Text>
          <Text style={styles.questionChipText}>{reading.question}</Text>
        </View>
      ) : null}
      {reading.cards.map((card, index) => (
        <TarotRevealCard
          key={`${card.card_id}-${card.position}-${index}`}
          card={card}
          index={index}
          compact={isThree}
          reduceMotion={reduceMotion}
        />
      ))}
      {reading.overall_reflection ? (
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>
            {isThree ? 'Overall reflection' : 'Reflection'}
          </Text>
          <Text style={styles.overallBody}>{reading.overall_reflection}</Text>
        </View>
      ) : null}
      {reading.reflection_prompt ? (
        <Text style={styles.prompt}>
          <Text style={styles.promptStrong}>Sit with this: </Text>
          {reading.reflection_prompt}
        </Text>
      ) : null}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>{reading.disclaimer}</Text>
      </View>
    </View>
  );
}

function TarotRevealCard({
  card,
  index,
  compact,
  reduceMotion,
}: {
  card: TarotCardReveal;
  index: number;
  compact: boolean;
  reduceMotion: boolean;
}) {
  const flipped = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      flipped.value = 1;
      return;
    }
    flipped.value = withDelay(
      180 + index * 220,
      withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
  }, [flipped, index, reduceMotion]);

  const flipInner = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${flipped.value * 180}deg` }],
  }));

  const imageUri = card.image_path ? resolveImageUrl(card.image_path) : null;

  return (
    <View style={[styles.revealCard, card.is_reversed && styles.revealReversed]}>
      <View style={[styles.flipScene, compact ? styles.flipSceneMd : styles.flipSceneLg]}>
        <Animated.View style={[styles.flipInner, flipInner]}>
          <View style={[styles.flipFace, styles.flipBack]}>
            <BrandGradient
              colors={[toolPalette.lavender, toolPalette.mint, toolPalette.cream]}
              angle={140}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="sparkles" size={28} color={toolPalette.white} />
          </View>
          <View style={[styles.flipFace, styles.flipFront]}>
            {imageUri ? (
              <RemoteImage
                uri={imageUri}
                resizeMode="contain"
                background="transparent"
                label={card.card_name}
                style={styles.cardImage}
              />
            ) : (
              <View style={styles.cardGlyphWrap}>
                <Text style={styles.cardGlyph}>{card.glyph || '🃏'}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
      <View style={styles.revealCopy}>
        <Text style={styles.positionLabel}>{card.position_label}</Text>
        <Text style={styles.cardTitle}>
          {card.card_name} · {card.orientation_label}
        </Text>
        <Text style={styles.coreMeaning}>{card.core_meaning}</Text>
        <Text style={styles.insight}>{card.insight}</Text>
      </View>
    </View>
  );
}

function HowStep({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <View style={styles.howRow}>
      <View style={styles.howBadge}>
        <Text style={styles.howBadgeText}>{index}</Text>
      </View>
      <View style={styles.grow}>
        <Text style={styles.howTitle}>{title}</Text>
        <Text style={styles.howBody}>{body}</Text>
      </View>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
        label="Tarot Reflection"
        style={compact ? styles.introImageCompact : styles.introImage}
      />
    </View>
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

function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox} accessibilityLabel={message}>
      <Ionicons name="alert-circle" size={18} color={toolPalette.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
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
  step: { gap: 14, marginTop: 4 },
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

  statRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: toolPalette.cream,
    alignItems: 'center',
  },
  statValue: { fontFamily: customerFonts.bold, fontSize: 16, color: toolPalette.navy },
  statLabel: { fontFamily: customerFonts.medium, fontSize: 11, color: toolPalette.muted, marginTop: 2 },

  note: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: toolPalette.mint,
  },
  noteText: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: toolPalette.body,
  },

  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 17, color: toolPalette.navy, marginTop: 4 },
  howStack: { gap: 10 },
  howRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  howBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: toolPalette.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howBadgeText: { fontFamily: customerFonts.bold, fontSize: 13, color: toolPalette.white },
  howTitle: { fontFamily: customerFonts.semibold, fontSize: 15, color: toolPalette.navy },
  howBody: { fontFamily: customerFonts.regular, fontSize: 13, color: toolPalette.muted, lineHeight: 18 },

  categoryStack: { gap: 8 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  categoryCardOn: { borderColor: toolPalette.teal, backgroundColor: toolPalette.mint },
  categoryEmoji: { fontSize: 26 },
  categoryLabel: { fontFamily: customerFonts.semibold, fontSize: 15, color: toolPalette.navy },
  categoryLabelOn: { color: toolPalette.tealDark },
  categoryBlurb: { fontFamily: customerFonts.regular, fontSize: 12, color: toolPalette.muted, lineHeight: 17 },

  fieldLabel: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },
  questionInput: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 14,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: toolPalette.navy,
  },
  exampleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exampleChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: toolPalette.cream,
    maxWidth: '100%',
  },
  exampleText: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.navy },

  spreadStack: { gap: 8 },
  spreadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  spreadCardOn: { borderColor: toolPalette.teal, backgroundColor: toolPalette.mint },
  spreadTitle: { fontFamily: customerFonts.semibold, fontSize: 15, color: toolPalette.navy },
  spreadTitleOn: { color: toolPalette.tealDark },
  spreadSubtitle: { fontFamily: customerFonts.regular, fontSize: 13, color: toolPalette.body },
  spreadMeta: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: toolPalette.cream,
  },
  toggleLabel: { fontFamily: customerFonts.semibold, fontSize: 14, color: toolPalette.navy },
  toggleHint: { fontFamily: customerFonts.regular, fontSize: 12, color: toolPalette.muted },

  questionChip: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: toolPalette.cream,
    gap: 6,
  },
  questionChipLabel: { fontFamily: customerFonts.semibold, fontSize: 12, color: toolPalette.muted },
  questionChipText: { fontFamily: customerFonts.medium, fontSize: 14, color: toolPalette.navy, lineHeight: 20 },

  drawProgress: { gap: 8 },
  drawMeta: { fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.body },
  drawStrong: { fontFamily: customerFonts.bold, color: toolPalette.tealDark },
  positionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  positionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: toolPalette.white,
    borderWidth: 1,
    borderColor: toolPalette.line,
  },
  positionDone: { backgroundColor: toolPalette.mintDeep, borderColor: toolPalette.teal },
  positionCurrent: { borderColor: toolPalette.teal, backgroundColor: toolPalette.mint },
  positionText: { fontFamily: customerFonts.medium, fontSize: 11, color: toolPalette.muted },
  positionTextOn: { fontFamily: customerFonts.semibold, color: toolPalette.navy },

  fanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  facedown: {
    width: '22%',
    minWidth: 72,
    aspectRatio: 0.68,
    borderRadius: 12,
    backgroundColor: toolPalette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadows.sm,
  },
  facedownPicked: { opacity: 0.45 },
  facedownBusy: { opacity: 0.75 },
  facedownMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: toolPalette.lavender,
    opacity: 0.7,
  },
  facedownHint: { fontFamily: customerFonts.medium, fontSize: 10, color: toolPalette.cream },

  revealWait: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  resultsStack: { gap: 14 },
  revealCard: {
    borderRadius: 20,
    padding: 14,
    gap: 12,
    backgroundColor: toolPalette.white,
    borderWidth: 1,
    borderColor: toolPalette.line,
    ...shadows.sm,
  },
  revealReversed: {},
  flipScene: {
    alignSelf: 'center',
  },
  flipSceneLg: { width: 160, height: 230 },
  flipSceneMd: { width: 130, height: 188 },
  flipInner: {
    width: '100%',
    height: '100%',
  },
  flipFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  flipBack: {
    backgroundColor: toolPalette.navy,
  },
  flipFront: {
    backgroundColor: toolPalette.cream,
    transform: [{ rotateY: '180deg' }],
  },
  cardImage: { width: '100%', height: '100%' },
  cardGlyphWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGlyph: { fontSize: 42 },

  revealCopy: { gap: 6 },
  positionLabel: { fontFamily: customerFonts.semibold, fontSize: 12, color: toolPalette.tealDark },
  cardTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: toolPalette.navy },
  coreMeaning: { fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.body, lineHeight: 19 },
  insight: { fontFamily: customerFonts.regular, fontSize: 14, color: toolPalette.muted, lineHeight: 20 },

  overallCard: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
    backgroundColor: toolPalette.mint,
  },
  overallTitle: { fontFamily: customerFonts.bold, fontSize: 16, color: toolPalette.navy },
  overallBody: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 21, color: toolPalette.body },

  prompt: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: toolPalette.body },
  promptStrong: { fontFamily: customerFonts.bold, color: toolPalette.navy },

  disclaimerBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: toolPalette.cream,
  },
  disclaimerText: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: toolPalette.muted },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  historyTitle: { fontFamily: customerFonts.semibold, fontSize: 15, color: toolPalette.navy },
  historyQuestion: { fontFamily: customerFonts.regular, fontSize: 13, color: toolPalette.body },
  historyMeta: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },

  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: toolPalette.teal,
    borderRadius: 16,
    paddingVertical: 14,
    ...shadows.sm,
  },
  primaryDisabled: { opacity: 0.55 },
  primaryText: { fontFamily: customerFonts.bold, fontSize: 16, color: toolPalette.white },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  link: { fontFamily: customerFonts.semibold, fontSize: 14, color: toolPalette.tealDark },

  errorBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
  },
  errorText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.danger },
  empty: { fontFamily: customerFonts.medium, fontSize: 14, color: toolPalette.muted },
  hint: { fontFamily: customerFonts.regular, fontSize: 13, color: toolPalette.muted, lineHeight: 18 },
  savedNote: {
    fontFamily: customerFonts.semibold,
    fontSize: 14,
    color: toolPalette.tealDark,
    textAlign: 'center',
  },

  state: {
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderRadius: 18,
    backgroundColor: toolPalette.cream,
  },
  stateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: toolPalette.mint,
  },
  stateTitle: { fontFamily: customerFonts.bold, fontSize: 17, color: toolPalette.navy },
  stateBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: toolPalette.body,
    textAlign: 'center',
    lineHeight: 20,
  },
});