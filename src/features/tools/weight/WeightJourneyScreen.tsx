import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
  withTiming,
} from 'react-native-reanimated';

import { BrandGradient } from '@/components/brand';
import { FadeInView, PressableScale } from '@/components/motion';
import { RemoteImage } from '@/features/customer/home/media';
import {
  formatStamp,
  newCompletionKey,
  useAccountScope,
} from '@/features/customer/myspace/accountData';
import { SignInToSave } from '@/features/customer/myspace/AccountTools';
import { customerActions } from '@/features/customer/store';
import { CustomerPage, IconButton } from '@/features/customer/ui';
import { ToolProgress } from '@/features/tools/chrome/ToolProgress';
import { ToolStepHeader } from '@/features/tools/chrome/ToolStepHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MySpaceRequestError } from '@/services/api/mySpace';
import { clearAuthToken } from '@/services/api/tokenStorage';
import {
  addWeightMeasurement,
  deleteWeightMeasurement,
  fetchWeightSummary,
  saveWeightGoal,
  type WeightSummary,
} from '@/services/api/weightJourney';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customerFonts, shadows, toolPalette } from '@/theme';

type Step = 'welcome' | 'dashboard' | 'log' | 'goal' | 'history';

const STEPS = [
  { id: 'welcome', label: 'Start' },
  { id: 'dashboard', label: 'Journey' },
  { id: 'log', label: 'Log' },
  { id: 'goal', label: 'Goal' },
  { id: 'history', label: 'History' },
] as const;

const ILLUSTRATION = 'frontend/assets/img/tools-illustrations/bmi-bmr-3d.webp';

function goBackHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

async function guarded<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof MySpaceRequestError && error.status === 401) {
      await clearAuthToken();
      customerActions.signOut();
    }
    throw error;
  }
}

export function WeightJourneyScreen() {
  const account = useAccountScope();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('welcome');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [direction, setDirection] = useState('track');
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [retryToken, setRetryToken] = useState<{ key: string; weight: string } | null>(null);

  const summaryQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'weight-summary'],
    queryFn: () => guarded(() => fetchWeightSummary()),
    enabled: account.enabled,
    retry: (count, error) =>
      !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const summary = summaryQuery.data;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'weight-summary'] });
  };

  const logMutation = useMutation({
    mutationFn: (input: { weight: string; unit: string; idempotency_key: string; note?: string }) =>
      guarded(() => addWeightMeasurement(input)),
    networkMode: 'always',
    onSuccess: async () => {
      setErrorMessage(null);
      setRetryToken(null);
      setWeight('');
      setNote('');
      setSavedFlash(true);
      setStep('dashboard');
      await invalidate();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Nothing was logged. You can try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => guarded(() => deleteWeightMeasurement(id)),
    networkMode: 'always',
    onSuccess: async () => {
      setErrorMessage(null);
      await invalidate();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not delete that entry.');
    },
  });

  const goalMutation = useMutation({
    mutationFn: () =>
      guarded(() =>
        saveWeightGoal({
          direction,
          starting_weight: startWeight,
          target_weight:
            direction === 'track' || direction === 'maintain'
              ? direction === 'maintain'
                ? startWeight
                : targetWeight || null
              : targetWeight,
          display_unit: unit,
        }),
      ),
    networkMode: 'always',
    onSuccess: async () => {
      setErrorMessage(null);
      setSavedFlash(true);
      setStep('dashboard');
      await invalidate();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save your goal.');
    },
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'welcome') {
        goBackHome();
        return true;
      }
      if (step === 'log' || step === 'goal' || step === 'history') {
        setStep('dashboard');
        return true;
      }
      setStep('welcome');
      return true;
    });
    return () => sub.remove();
  });

  useEffect(() => {
    if (!savedFlash) return;
    const timer = setTimeout(() => setSavedFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const openGoal = () => {
    if (summary) {
      setUnit(summary.unit === 'lb' ? 'lb' : 'kg');
      if (summary.goal) {
        setDirection(summary.goal.direction);
        setStartWeight(
          summary.goal.starting_weight_kg.replace(/\.?0+$/, '') || summary.goal.starting_weight_kg,
        );
        setTargetWeight(
          summary.goal.target_weight_kg
            ? summary.goal.target_weight_kg.replace(/\.?0+$/, '') || summary.goal.target_weight_kg
            : '',
        );
      } else {
        setDirection('track');
        setStartWeight(summary.latest?.replace(/\.?0+$/, '') || '');
        setTargetWeight('');
      }
    }
    setErrorMessage(null);
    setStep('goal');
  };

  const openLog = () => {
    if (summary) setUnit(summary.unit === 'lb' ? 'lb' : 'kg');
    setErrorMessage(null);
    setStep('log');
  };

  const leaveSafely = () => {
    const dirty = Boolean(weight.trim() || note.trim()) && step === 'log';
    if (!dirty) {
      if (step === 'welcome') goBackHome();
      else if (step === 'dashboard') setStep('welcome');
      else setStep('dashboard');
      return;
    }
    Alert.alert('Leave without saving?', 'Your unfinished weight entry stays only on this screen until you save.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          setWeight('');
          setNote('');
          setStep('dashboard');
        },
      },
    ]);
  };

  const onSaveWeight = () => {
    if (!summary || logMutation.isPending) return;
    const trimmed = weight.trim();
    if (!trimmed) {
      setErrorMessage('Enter a weight before saving.');
      return;
    }
    const key =
      retryToken && retryToken.weight === trimmed ? retryToken.key : newCompletionKey();
    setRetryToken({ key, weight: trimmed });
    setErrorMessage(null);
    logMutation.mutate({
      weight: trimmed,
      unit,
      idempotency_key: key,
      note: note.trim() || undefined,
    });
  };

  if (!account.enabled) {
    return (
      <CustomerPage onBack={goBackHome}>
        <IntroArt />
        <ToolStepHeader
          eyebrow="Weight Journey"
          title="Your Journey, Your Progress"
          body="Track your progress with care, one step at a time."
          accent={toolPalette.tealDark}
          ink={toolPalette.navy}
        />
        <SignInToSave what="weight journey" />
      </CustomerPage>
    );
  }

  if (summaryQuery.isLoading) {
    return (
      <CustomerPage onBack={goBackHome}>
        <ActivityIndicator color={toolPalette.teal} style={{ marginTop: 40 }} />
      </CustomerPage>
    );
  }

  if (summaryQuery.isError || !summary) {
    const closed =
      summaryQuery.error instanceof MySpaceRequestError && summaryQuery.error.status === 403;
    return (
      <CustomerPage onBack={goBackHome}>
        <StateCard
          icon={closed ? 'pause-circle-outline' : 'cloud-offline-outline'}
          title={closed ? 'Not available right now' : 'Could not load this tool'}
          body={
            closed
              ? 'This tool has been paused on YuktiOne. Please check back later.'
              : summaryQuery.error?.message ?? 'Check your connection and try again.'
          }
          action={closed ? 'Back to tools' : 'Try again'}
          onAction={closed ? goBackHome : () => void summaryQuery.refetch()}
        />
      </CustomerPage>
    );
  }

  const progressPercent = summary.progress?.meaningful ? summary.progress.percent ?? 0 : 0;
  const footer =
    step === 'welcome' ? (
      <PrimaryAction label="Start Tracking" icon="speedometer-outline" onPress={() => setStep('dashboard')} />
    ) : step === 'log' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label={logMutation.isPending ? 'Saving…' : 'Save weight'}
          disabled={logMutation.isPending}
          loading={logMutation.isPending}
          onPress={onSaveWeight}
        />
        <TextLink label="Back" onPress={leaveSafely} />
      </View>
    ) : step === 'goal' ? (
      <View style={styles.footerStack}>
        <PrimaryAction
          label={goalMutation.isPending ? 'Saving…' : 'Save goal'}
          disabled={goalMutation.isPending}
          loading={goalMutation.isPending}
          onPress={() => {
            setErrorMessage(null);
            goalMutation.mutate();
          }}
        />
        <TextLink label="Back" onPress={() => setStep('dashboard')} />
      </View>
    ) : null;

  return (
    <CustomerPage
      onBack={leaveSafely}
      dismissKeyboardOnDrag
      footer={footer}
      right={
        step === 'dashboard' ? (
          <IconButton
            icon="add-circle-outline"
            label="Log weight"
            onPress={openLog}
          />
        ) : undefined
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <IntroArt compact={step !== 'welcome'} />
        <ToolProgress
          steps={[...STEPS]}
          current={step}
          accent={toolPalette.teal}
          accentSoft={toolPalette.mintDeep}
          ink={toolPalette.navy}
        />

        {step === 'welcome' ? (
          <FadeInView key="welcome" style={styles.step}>
            <ToolStepHeader
              title="Your Journey, Your Progress"
              body="Track your progress with care, one step at a time."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.note}>
              <Ionicons name="lock-closed-outline" size={16} color={toolPalette.teal} />
              <Text style={styles.noteText}>
                Measurements save to your YuktiOne account — the same history as the website.
              </Text>
            </View>
          </FadeInView>
        ) : null}

        {step === 'dashboard' ? (
          <FadeInView key="dashboard" style={styles.step}>
            <ToolStepHeader
              title="Your journey"
              body="Neutral progress from your saved measurements."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            {savedFlash ? <SavedBanner reduceMotion={reduceMotion} /> : null}

            <View style={styles.heroCard}>
              <ProgressRing percent={progressPercent} meaningful={Boolean(summary.progress?.meaningful)} />
              <Text style={styles.heroValue}>{summary.latest_label ?? 'No weight yet'}</Text>
              <Text style={styles.heroMeta}>
                {summary.latest_recorded_at
                  ? `Last logged ${formatStamp(summary.latest_recorded_at)}`
                  : 'Log a weight to begin'}
              </Text>
              {summary.net_label ? (
                <Text style={styles.heroMeta}>Net change: {summary.net_label}</Text>
              ) : null}
            </View>

            <View style={styles.statRow}>
              <StatCard
                label="Starting"
                value={summary.goal_starting_label ?? summary.starting_label ?? '—'}
              />
              <StatCard label="Target" value={summary.target_label ?? '—'} />
            </View>
            {summary.goal ? (
              <Text style={styles.goalLine}>
                Goal: {summary.goal.direction_label}
                {summary.distance_label ? ` · Distance ${summary.distance_label}` : ''}
              </Text>
            ) : (
              <Text style={styles.goalLine}>No active goal yet. Set one when you’re ready.</Text>
            )}

            <View style={styles.actionRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Log weight"
                onPress={openLog}
                style={styles.actionChip}
              >
                <Ionicons name="create-outline" size={18} color={toolPalette.tealDark} />
                <Text style={styles.actionText}>Log weight</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Edit goal"
                onPress={openGoal}
                style={styles.actionChip}
              >
                <Ionicons name="flag-outline" size={18} color={toolPalette.tealDark} />
                <Text style={styles.actionText}>Goal</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="View history"
                onPress={() => setStep('history')}
                style={styles.actionChip}
              >
                <Ionicons name="stats-chart-outline" size={18} color={toolPalette.tealDark} />
                <Text style={styles.actionText}>History</Text>
              </PressableScale>
            </View>

            <Text style={styles.sectionTitle}>Trend (30 days)</Text>
            <WeightChart points={summary.chart.points} />

            <Text style={styles.sectionTitle}>Recent</Text>
            {summary.recent.length === 0 ? (
              <Text style={styles.empty}>No measurements yet.</Text>
            ) : (
              summary.recent.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.logRow}>
                  <Text style={styles.logWeight}>{item.label}</Text>
                  <Text style={styles.logTime}>{formatStamp(item.recorded_at)}</Text>
                </View>
              ))
            )}
            <TextLink label="Back to welcome" onPress={() => setStep('welcome')} />
          </FadeInView>
        ) : null}

        {step === 'log' ? (
          <FadeInView key="log" style={styles.step}>
            <ToolStepHeader
              title="Log a weight"
              body={`Enter weight in ${unit}. Range follows the website (20–400 kg).`}
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <UnitToggle unit={unit} onChange={setUnit} />
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder={unit === 'kg' ? 'e.g. 72.5' : 'e.g. 160'}
              placeholderTextColor={toolPalette.muted}
              accessibilityLabel="Weight value"
              style={styles.input}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={summary.note_max}
              placeholder="Note (optional)"
              placeholderTextColor={toolPalette.muted}
              accessibilityLabel="Optional note"
              style={styles.input}
            />
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          </FadeInView>
        ) : null}

        {step === 'goal' ? (
          <FadeInView key="goal" style={styles.step}>
            <ToolStepHeader
              title="Your goal"
              body="Progress percentages are geometric only — not judgment."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <UnitToggle unit={unit} onChange={setUnit} />
            <View style={styles.dirList}>
              {summary.directions.map((item) => (
                <PressableScale
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: direction === item.key }}
                  accessibilityLabel={item.label}
                  onPress={() => setDirection(item.key)}
                  style={[styles.dirChip, direction === item.key && styles.dirChipOn]}
                >
                  <Text style={[styles.dirText, direction === item.key && styles.dirTextOn]}>
                    {item.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Starting weight ({unit})</Text>
            <TextInput
              value={startWeight}
              onChangeText={setStartWeight}
              keyboardType="decimal-pad"
              accessibilityLabel="Starting weight"
              style={styles.input}
            />
            {direction !== 'track' && direction !== 'maintain' ? (
              <>
                <Text style={styles.fieldLabel}>Target weight ({unit})</Text>
                <TextInput
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Target weight"
                  style={styles.input}
                />
              </>
            ) : null}
            {direction === 'maintain' ? (
              <Text style={styles.hint}>Maintain keeps target equal to starting weight.</Text>
            ) : null}
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}
          </FadeInView>
        ) : null}

        {step === 'history' ? (
          <FadeInView key="history" style={styles.step}>
            <ToolStepHeader
              title="History"
              body="All measurements from your account."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <WeightChart points={summary.chart.points} />
            {summary.recent.length === 0 ? (
              <Text style={styles.empty}>No history yet.</Text>
            ) : (
              summary.recent.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.grow}>
                    <Text style={styles.logWeight}>{item.label}</Text>
                    <Text style={styles.logTime}>{formatStamp(item.recorded_at)}</Text>
                    {item.note ? <Text style={styles.noteMeta}>{item.note}</Text> : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.label}`}
                    disabled={deleteMutation.isPending}
                    onPress={() =>
                      Alert.alert('Delete this entry?', 'This removes the measurement from your account.', [
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
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}
            <TextLink label="Back to journey" onPress={() => setStep('dashboard')} />
          </FadeInView>
        ) : null}
      </KeyboardAvoidingView>
    </CustomerPage>
  );
}

function ProgressRing({ percent, meaningful }: { percent: number; meaningful: boolean }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(meaningful ? Math.max(0, Math.min(percent, 100)) / 100 : 0, {
      duration: reduceMotion ? 0 : 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [meaningful, percent, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.ringTrack} accessibilityLabel={meaningful ? `Progress ${percent} percent` : 'No percent progress'}>
      <Animated.View style={[styles.ringFill, fillStyle]} />
      <Text style={styles.ringLabel}>{meaningful ? `${percent}%` : '—'}</Text>
    </View>
  );
}

function WeightChart({ points }: { points: WeightSummary['chart']['points'] }) {
  if (points.length === 0) {
    return <Text style={styles.empty}>Not enough points for a chart yet.</Text>;
  }
  const values = points.map((point) => Number(point.weight_kg));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);

  return (
    <View style={styles.chartCard} accessibilityLabel="Weight trend chart">
      <View style={styles.chartRow}>
        {points.map((point) => {
          const ratio = (Number(point.weight_kg) - min) / span;
          const height = 24 + ratio * 72;
          return (
            <View key={point.date} style={styles.chartCol}>
              <View style={[styles.chartBar, { height }]} />
              <Text style={styles.chartDay}>{point.date.slice(5)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function UnitToggle({ unit, onChange }: { unit: 'kg' | 'lb'; onChange: (unit: 'kg' | 'lb') => void }) {
  return (
    <View style={styles.unitRow}>
      {(['kg', 'lb'] as const).map((item) => (
        <PressableScale
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: unit === item }}
          onPress={() => onChange(item)}
          style={[styles.unitChip, unit === item && styles.unitChipOn]}
        >
          <Text style={[styles.unitText, unit === item && styles.unitTextOn]}>{item}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SavedBanner({ reduceMotion }: { reduceMotion: boolean }) {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: reduceMotion ? 0 : 350 });
  }, [opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.savedBanner, style]}>
      <Ionicons name="checkmark-circle" size={18} color={toolPalette.teal} />
      <Text style={styles.savedText}>Saved to your account</Text>
    </Animated.View>
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
        label="Weight Journey"
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

  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    ...shadows.md,
  },
  heroValue: {
    fontFamily: customerFonts.bold,
    fontSize: 28,
    color: toolPalette.navy,
    letterSpacing: -0.4,
  },
  heroMeta: {
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: toolPalette.muted,
    textAlign: 'center',
  },

  ringTrack: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    backgroundColor: toolPalette.line,
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ringFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: toolPalette.teal,
    borderRadius: 999,
  },
  ringLabel: {
    alignSelf: 'center',
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: toolPalette.navy,
  },

  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.cream,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
  },
  statValue: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: toolPalette.navy,
  },
  goalLine: {
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: toolPalette.body,
  },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: toolPalette.mint,
  },
  actionText: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: toolPalette.tealDark,
  },

  sectionTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: toolPalette.navy,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 12,
    minHeight: 120,
  },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 100 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBar: {
    width: '70%',
    borderRadius: 8,
    backgroundColor: toolPalette.teal,
    minHeight: 8,
  },
  chartDay: {
    fontFamily: customerFonts.medium,
    fontSize: 9,
    color: toolPalette.muted,
  },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: toolPalette.cream,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  logWeight: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: toolPalette.navy,
  },
  logTime: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
  },
  noteMeta: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: toolPalette.body,
  },
  empty: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: toolPalette.muted,
  },

  unitRow: { flexDirection: 'row', gap: 8 },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  unitChipOn: {
    backgroundColor: toolPalette.teal,
    borderColor: toolPalette.teal,
  },
  unitText: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: toolPalette.navy,
  },
  unitTextOn: { color: toolPalette.white },

  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    paddingHorizontal: 14,
    fontFamily: customerFonts.medium,
    fontSize: 16,
    color: toolPalette.navy,
  },
  fieldLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: toolPalette.navy,
  },
  hint: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: toolPalette.muted,
  },

  dirList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dirChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.cream,
  },
  dirChipOn: {
    borderColor: toolPalette.teal,
    backgroundColor: toolPalette.mint,
  },
  dirText: {
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: toolPalette.body,
  },
  dirTextOn: {
    fontFamily: customerFonts.bold,
    color: toolPalette.tealDark,
  },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: toolPalette.mint,
  },
  savedText: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: toolPalette.tealDark,
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
