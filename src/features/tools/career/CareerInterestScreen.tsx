import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
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
import {
  completeCareerAssessment,
  deleteCareerAttempt,
  fetchCareerAttempt,
  fetchCareerHistory,
  fetchCareerOptions,
  previewCareerAssessment,
  type CareerAttempt,
  type CareerResult,
} from '@/services/api/careerInterest';
import { MySpaceRequestError } from '@/services/api/mySpace';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customerFonts, shadows, toolPalette } from '@/theme';

type Step = 'welcome' | 'about' | 'questions' | 'review' | 'results' | 'history';

const STEPS = [
  { id: 'welcome', label: 'Start' },
  { id: 'about', label: 'About' },
  { id: 'questions', label: 'Assess' },
  { id: 'review', label: 'Review' },
  { id: 'results', label: 'Results' },
] as const;

const ILLUSTRATION = 'frontend/assets/img/tools-illustrations/career-interest-3d.webp';

function goBackHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

export function CareerInterestScreen() {
  const account = useAccountScope();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>('welcome');
  const [completionKey, setCompletionKey] = useState(newCompletionKey);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [education, setEducation] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [geography, setGeography] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<CareerResult | CareerAttempt | null>(null);
  const [savedAttemptId, setSavedAttemptId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewAttemptId, setViewAttemptId] = useState<number | null>(null);

  const optionsQuery = useQuery({
    queryKey: ['v1', 'career-interest', 'options'],
    queryFn: () => fetchCareerOptions(),
    retry: (count, error) =>
      !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const historyQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'career-history'],
    queryFn: () => fetchCareerHistory(),
    enabled: account.enabled && step === 'history',
  });

  const attemptQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'career-attempt', viewAttemptId],
    queryFn: () => fetchCareerAttempt(viewAttemptId!),
    enabled: account.enabled && step === 'results' && viewAttemptId !== null,
  });

  const options = optionsQuery.data;

  const orderedQuestions = useMemo(() => {
    if (!options) return [];
    const ordered = [];
    for (const cat of options.category_order) {
      for (const q of options.questions) {
        if (q.category === cat) ordered.push(q);
      }
    }
    return ordered.length ? ordered : options.questions;
  }, [options]);

  const answeredCount = orderedQuestions.filter((q) => answers[q.id] !== undefined).length;
  const missingIds = orderedQuestions.filter((q) => answers[q.id] === undefined).map((q) => q.id);
  const aboutComplete = Boolean(ageGroup && education && situation && geography);
  const currentQuestion = orderedQuestions[questionIndex] ?? null;

  const previewMutation = useMutation({
    mutationFn: () =>
      previewCareerAssessment({
        age_group: ageGroup!,
        education: education!,
        situation: situation!,
        geography: geography!,
        answers,
      }),
    onSuccess: (data) => {
      setErrorMessage(null);
      setResult(data.result);
      setSavedAttemptId(null);
      setViewAttemptId(null);
      setStep('results');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not score this assessment.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      completeCareerAssessment({
        completion_key: completionKey,
        age_group: ageGroup!,
        education: education!,
        situation: situation!,
        geography: geography!,
        answers,
      }),
    networkMode: 'always',
    onSuccess: async (data) => {
      setErrorMessage(null);
      setResult(data.attempt);
      setSavedAttemptId(data.attempt.id);
      setViewAttemptId(null);
      setStep('results');
      await queryClient.invalidateQueries({
        queryKey: ['v1', 'my', account.userId, 'career-history'],
      });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save. You can retry safely.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCareerAttempt(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['v1', 'my', account.userId, 'career-history'],
      });
      setStep('history');
    },
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'welcome') {
        goBackHome();
        return true;
      }
      if (step === 'about') {
        setStep('welcome');
        return true;
      }
      if (step === 'questions') {
        if (questionIndex > 0) setQuestionIndex((i) => i - 1);
        else setStep('about');
        return true;
      }
      if (step === 'review') {
        setStep('questions');
        return true;
      }
      if (step === 'results' || step === 'history') {
        setStep('welcome');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });

  const displayResult =
    viewAttemptId !== null && attemptQuery.data ? attemptQuery.data : result;

  const restart = () => {
    setCompletionKey(newCompletionKey());
    setAgeGroup(null);
    setEducation(null);
    setSituation(null);
    setGeography(null);
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setSavedAttemptId(null);
    setViewAttemptId(null);
    setErrorMessage(null);
    setStep('welcome');
    previewMutation.reset();
    saveMutation.reset();
  };

  const progressCurrent =
    step === 'history' ? 'welcome' : step === 'results' ? 'results' : step;

  const selectAnswer = (value: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const goNextQuestion = () => {
    if (!currentQuestion || answers[currentQuestion.id] === undefined) {
      setErrorMessage('Choose an answer to continue.');
      return;
    }
    setErrorMessage(null);
    if (questionIndex >= orderedQuestions.length - 1) {
      setStep('review');
      return;
    }
    setQuestionIndex((i) => i + 1);
  };

  const submitPreview = () => {
    if (!aboutComplete || missingIds.length > 0) {
      setErrorMessage('Answer every question before viewing results.');
      return;
    }
    setErrorMessage(null);
    previewMutation.mutate();
  };

  const submitSave = () => {
    if (!account.enabled) return;
    if (!aboutComplete || missingIds.length > 0) {
      setErrorMessage('Answer every question before saving.');
      return;
    }
    setErrorMessage(null);
    saveMutation.mutate();
  };

  if (optionsQuery.isLoading) {
    return (
      <CustomerPage onBack={goBackHome}>
        <ActivityIndicator color={toolPalette.teal} style={{ marginTop: 40 }} />
      </CustomerPage>
    );
  }

  if (optionsQuery.isError || !options) {
    const closed =
      optionsQuery.error instanceof MySpaceRequestError && optionsQuery.error.status === 403;
    return (
      <CustomerPage onBack={goBackHome}>
        <StateCard
          icon={closed ? 'pause-circle-outline' : 'cloud-offline-outline'}
          title={closed ? 'Not available right now' : 'Could not load this tool'}
          body={
            closed
              ? 'This assessment has been paused on YuktiOne. Please check back later.'
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

  return (
    <CustomerPage
      onBack={() => {
        if (step === 'welcome') goBackHome();
        else if (step === 'about') setStep('welcome');
        else if (step === 'questions') {
          if (questionIndex > 0) setQuestionIndex((i) => i - 1);
          else setStep('about');
        } else if (step === 'review') setStep('questions');
        else setStep('welcome');
      }}
      right={
        account.enabled && step === 'welcome' ? (
          <IconButton
            icon="time-outline"
            label="History"
            onPress={() => setStep('history')}
          />
        ) : undefined
      }
    >
      <IntroArt compact={step !== 'welcome'} />
      {step !== 'history' ? (
        <ToolProgress
          steps={[...STEPS]}
          current={progressCurrent}
          accent={toolPalette.teal}
          accentSoft={toolPalette.mintDeep}
          ink={toolPalette.navy}
        />
      ) : null}

      {step === 'welcome' ? (
        <FadeInView key="welcome" style={styles.step}>
          <ToolStepHeader
            eyebrow="Career Interest"
            title="Discover Your Career Direction"
            body="Explore your interests and discover paths that feel right for you."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <View style={styles.statRow}>
            <StatChip label="Questions" value={String(options.question_count)} />
            <StatChip label="Duration" value={options.duration_label} />
            <StatChip label="Areas" value={String(options.category_count)} />
          </View>
          <View style={styles.note}>
            <Ionicons name="compass-outline" size={16} color={toolPalette.teal} />
            <Text style={styles.noteText}>{options.disclaimer}</Text>
          </View>
          <PrimaryAction
            label="Start Assessment"
            icon="play"
            onPress={() => {
              setErrorMessage(null);
              setStep('about');
            }}
          />
          {account.enabled ? (
            <TextLink label="View history" onPress={() => setStep('history')} />
          ) : (
            <Text style={styles.hint}>Guests can take the test. Sign in to save results.</Text>
          )}
        </FadeInView>
      ) : null}

      {step === 'about' ? (
        <FadeInView key="about" style={styles.step}>
          <ToolStepHeader
            title="About you"
            body="Helps tailor exploratory suggestions—never eligibility claims."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <ChoiceGroup
            label="Age group"
            choices={options.about.age_groups}
            value={ageGroup}
            onChange={setAgeGroup}
          />
          <ChoiceGroup
            label="Education"
            choices={options.about.education}
            value={education}
            onChange={setEducation}
          />
          <ChoiceGroup
            label="Situation"
            choices={options.about.situations}
            value={situation}
            onChange={setSituation}
          />
          <ChoiceGroup
            label="Geography"
            choices={options.about.geographies}
            value={geography}
            onChange={setGeography}
          />
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          <PrimaryAction
            label="Continue to questions"
            disabled={!aboutComplete}
            onPress={() => {
              if (!aboutComplete) {
                setErrorMessage('Select each about-you field to continue.');
                return;
              }
              setErrorMessage(null);
              setQuestionIndex(0);
              setStep('questions');
            }}
          />
          <TextLink label="Back" onPress={() => setStep('welcome')} />
        </FadeInView>
      ) : null}

      {step === 'questions' && currentQuestion ? (
        <FadeInView key={`q-${currentQuestion.id}`} style={styles.step}>
          <Text style={styles.qMeta}>
            Question {questionIndex + 1} of {orderedQuestions.length} ·{' '}
            {options.categories.find((c) => c.key === currentQuestion.category)?.label ??
              currentQuestion.category}
          </Text>
          <ToolStepHeader
            title={currentQuestion.text}
            body="Rate how much this interest fits you."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <View style={styles.scaleStack}>
            {options.scale.map((opt) => {
              const selected = answers[currentQuestion.id] === opt.value;
              return (
                <PressableScale
                  key={opt.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${opt.label}, ${opt.value}`}
                  onPress={() => selectAnswer(opt.value)}
                  style={[styles.scaleCard, selected && styles.scaleCardOn]}
                >
                  <Text style={styles.scaleEmoji}>{opt.emoji}</Text>
                  <View style={styles.grow}>
                    <Text style={[styles.scaleLabel, selected && styles.scaleLabelOn]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.scaleValue}>{opt.value}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={toolPalette.teal} />
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          <View style={styles.navRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Previous question"
              onPress={() => {
                setErrorMessage(null);
                if (questionIndex > 0) setQuestionIndex((i) => i - 1);
                else setStep('about');
              }}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>Back</Text>
            </PressableScale>
            <PrimaryAction
              label={questionIndex >= orderedQuestions.length - 1 ? 'Review' : 'Next'}
              onPress={goNextQuestion}
            />
          </View>
        </FadeInView>
      ) : null}

      {step === 'review' ? (
        <FadeInView key="review" style={styles.step}>
          <ToolStepHeader
            title="Review your answers"
            body="Check anything you want to change before seeing results."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          <Text style={styles.reviewCount}>
            {answeredCount} of {orderedQuestions.length} answered
          </Text>
          {missingIds.length > 0 ? (
            <ErrorBox message={`${missingIds.length} question(s) still need an answer.`} />
          ) : null}
          {orderedQuestions.map((q, index) => (
            <PressableScale
              key={q.id}
              accessibilityRole="button"
              accessibilityLabel={`Edit question ${index + 1}`}
              onPress={() => {
                setQuestionIndex(index);
                setStep('questions');
              }}
              style={styles.reviewRow}
            >
              <View style={styles.grow}>
                <Text style={styles.reviewQ} numberOfLines={2}>
                  {index + 1}. {q.text}
                </Text>
                <Text style={styles.reviewA}>
                  {answers[q.id] !== undefined
                    ? options.scale.find((s) => s.value === answers[q.id])?.label
                    : 'Missing'}
                </Text>
              </View>
              <Ionicons name="create-outline" size={18} color={toolPalette.tealDark} />
            </PressableScale>
          ))}
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          <PrimaryAction
            label={previewMutation.isPending ? 'Scoring…' : 'See results'}
            loading={previewMutation.isPending}
            disabled={missingIds.length > 0 || previewMutation.isPending}
            onPress={submitPreview}
          />
          <TextLink label="Back to questions" onPress={() => setStep('questions')} />
        </FadeInView>
      ) : null}

      {step === 'results' ? (
        <FadeInView key="results" style={styles.step}>
          <ToolStepHeader
            title="Your interest profile"
            body="Exploratory results from your answers—not aptitude or guaranteed outcomes."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          {attemptQuery.isLoading && viewAttemptId ? (
            <ActivityIndicator color={toolPalette.teal} />
          ) : displayResult ? (
            <ResultsBody
              result={displayResult}
              reduceMotion={reduceMotion}
              saved={savedAttemptId !== null || viewAttemptId !== null}
            />
          ) : null}
          {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          {!account.enabled ? (
            <SignInToSave what="career interest results" />
          ) : savedAttemptId === null && viewAttemptId === null && displayResult ? (
            <PrimaryAction
              label={saveMutation.isPending ? 'Saving…' : 'Save to my account'}
              loading={saveMutation.isPending}
              onPress={submitSave}
            />
          ) : account.enabled && (savedAttemptId !== null || viewAttemptId !== null) ? (
            <Text style={styles.savedNote}>Saved to your YuktiOne account</Text>
          ) : null}
          <PrimaryAction label="Retake assessment" onPress={restart} />
          <TextLink label="Back to start" onPress={() => setStep('welcome')} />
        </FadeInView>
      ) : null}

      {step === 'history' ? (
        <FadeInView key="history" style={styles.step}>
          <ToolStepHeader
            title="Saved assessments"
            body="Revisit results you saved to your account."
            accent={toolPalette.tealDark}
            ink={toolPalette.navy}
          />
          {!account.enabled ? (
            <SignInToSave what="career interest history" />
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
          ) : historyQuery.data?.attempts.length === 0 ? (
            <Text style={styles.empty}>No saved assessments yet.</Text>
          ) : (
            historyQuery.data?.attempts.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => {
                    setViewAttemptId(item.id);
                    setSavedAttemptId(item.id);
                    setStep('results');
                  }}
                  style={styles.grow}
                >
                  <Text style={styles.historyTitle}>
                    {item.top_labels.join(' · ') || 'Interest profile'}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.completed_at ? formatStamp(item.completed_at) : 'Saved'}
                  </Text>
                </PressableScale>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete assessment"
                  onPress={() =>
                    Alert.alert('Delete this result?', 'This cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteMutation.mutate(item.id),
                      },
                    ])
                  }
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={toolPalette.danger} />
                </Pressable>
              </View>
            ))
          )}
          <TextLink label="Back" onPress={() => setStep('welcome')} />
        </FadeInView>
      ) : null}
    </CustomerPage>
  );
}

function ResultsBody({
  result,
  reduceMotion,
  saved,
}: {
  result: CareerResult | CareerAttempt;
  reduceMotion: boolean;
  saved: boolean;
}) {
  const primary = result.ranked[0];
  return (
    <View style={styles.resultsStack}>
      {saved ? null : null}
      <View style={styles.heroCard}>
        <Text style={styles.primaryLabel}>Primary interest</Text>
        <Text style={styles.primaryValue}>{primary?.label ?? '—'}</Text>
        <Text style={styles.primaryPct}>{primary ? `${primary.percent}%` : ''}</Text>
        <Text style={styles.interpretation}>{result.interpretation}</Text>
      </View>
      <Text style={styles.sectionTitle}>Interest profile</Text>
      {result.ranked.map((row) => (
        <ScoreBar key={row.key} label={row.label} percent={row.percent} reduceMotion={reduceMotion} />
      ))}
      <Text style={styles.sectionTitle}>Career directions to explore</Text>
      <Text style={styles.hint}>
        {result.recommendations.disclaimer ??
          'Suggestions are exploratory starting points—not guarantees.'}
      </Text>
      {result.recommendations.items.length === 0 ? (
        <Text style={styles.empty}>No strong catalogue matches for this profile yet.</Text>
      ) : (
        result.recommendations.items.map((item) => (
          <View key={item.id} style={styles.recCard}>
            <Text style={styles.recTitle}>{item.title}</Text>
            <Text style={styles.recSummary}>{item.summary}</Text>
            <Text style={styles.recWhy}>{item.why}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function ScoreBar({
  label,
  percent,
  reduceMotion,
}: {
  label: string;
  percent: number;
  reduceMotion: boolean;
}) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(100, percent)), {
      duration: reduceMotion ? 0 : 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent, reduceMotion, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={styles.barRow}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barPct}>{percent}%</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, fill]} />
      </View>
    </View>
  );
}

function ChoiceGroup({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: { key: string; label: string }[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.choiceBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceWrap}>
        {choices.map((choice) => {
          const on = value === choice.key;
          return (
            <PressableScale
              key={choice.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(choice.key)}
              style={[styles.choiceChip, on && styles.choiceChipOn]}
            >
              <Text style={[styles.choiceText, on && styles.choiceTextOn]}>{choice.label}</Text>
            </PressableScale>
          );
        })}
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
        label="Career Interest"
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
      style={[styles.primary, inactive && styles.primaryDisabled, styles.primaryFlex]}
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

  choiceBlock: { gap: 8 },
  fieldLabel: { fontFamily: customerFonts.semibold, fontSize: 13, color: toolPalette.navy },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  choiceChipOn: { backgroundColor: toolPalette.mint, borderColor: toolPalette.teal },
  choiceText: { fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.navy },
  choiceTextOn: { fontFamily: customerFonts.semibold, color: toolPalette.tealDark },

  qMeta: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },
  scaleStack: { gap: 8 },
  scaleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  scaleCardOn: { borderColor: toolPalette.teal, backgroundColor: toolPalette.mint },
  scaleEmoji: { fontSize: 22 },
  scaleLabel: { fontFamily: customerFonts.semibold, fontSize: 15, color: toolPalette.navy },
  scaleLabelOn: { color: toolPalette.tealDark },
  scaleValue: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },

  navRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: toolPalette.cream,
  },
  secondaryText: { fontFamily: customerFonts.semibold, fontSize: 15, color: toolPalette.navy },
  primaryFlex: { flex: 1 },

  reviewCount: { fontFamily: customerFonts.semibold, fontSize: 14, color: toolPalette.tealDark },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  reviewQ: { fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.navy },
  reviewA: { fontFamily: customerFonts.regular, fontSize: 12, color: toolPalette.muted },

  resultsStack: { gap: 12 },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: toolPalette.white,
    borderWidth: 1,
    borderColor: toolPalette.line,
    gap: 6,
    ...shadows.md,
  },
  primaryLabel: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },
  primaryValue: { fontFamily: customerFonts.bold, fontSize: 24, color: toolPalette.navy },
  primaryPct: { fontFamily: customerFonts.bold, fontSize: 18, color: toolPalette.teal },
  interpretation: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: toolPalette.body,
    marginTop: 4,
  },
  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 17, color: toolPalette.navy, marginTop: 4 },

  barRow: { gap: 6 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontFamily: customerFonts.semibold, fontSize: 13, color: toolPalette.navy },
  barPct: { fontFamily: customerFonts.bold, fontSize: 13, color: toolPalette.tealDark },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: toolPalette.line,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: toolPalette.teal, borderRadius: 999 },

  recCard: {
    borderRadius: 16,
    padding: 14,
    gap: 4,
    backgroundColor: toolPalette.cream,
  },
  recTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: toolPalette.navy },
  recSummary: { fontFamily: customerFonts.regular, fontSize: 13, color: toolPalette.body, lineHeight: 18 },
  recWhy: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted, lineHeight: 17 },

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
  historyMeta: { fontFamily: customerFonts.regular, fontSize: 12, color: toolPalette.muted },

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
