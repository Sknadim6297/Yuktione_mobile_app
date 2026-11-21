import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { CustomerPage, IconButton } from '@/features/customer/ui';
import { ToolProgress } from '@/features/tools/chrome/ToolProgress';
import { ToolStepHeader } from '@/features/tools/chrome/ToolStepHeader';
import { WaterGlass } from '@/features/tools/water/WaterGlass';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MySpaceRequestError } from '@/services/api/mySpace';
import {
  addWaterEntry,
  deleteWaterEntry,
  fetchWaterDashboard,
  fetchWaterWeek,
  updateWaterSettings,
  type WaterDashboardSnapshot,
} from '@/services/api/waterIntake';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { clearAuthToken } from '@/services/api/tokenStorage';
import { customerActions } from '@/features/customer/store';
import { customerFonts, shadows, toolPalette } from '@/theme';

type Step = 'welcome' | 'track';

const STEPS = [
  { id: 'welcome', label: 'Start' },
  { id: 'track', label: 'Track' },
] as const;

/** Website ToolIllustration maps water → bmi-bmr-3d.webp */
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

export function WaterIntakeScreen() {
  const account = useAccountScope();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('welcome');
  const [customMl, setCustomMl] = useState('');
  const [goalDraft, setGoalDraft] = useState('');
  const [showGoal, setShowGoal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState<{ key: string; amount: number } | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'water-dashboard'],
    queryFn: () => guarded(() => fetchWaterDashboard()),
    enabled: account.enabled,
    retry: (count, error) =>
      !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const weekQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'water-week'],
    queryFn: () => guarded(() => fetchWaterWeek()),
    enabled: account.enabled && step === 'track',
    retry: (count, error) =>
      !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const dash = dashboardQuery.data;
  const celebrate = Boolean(dash && dash.goal_ml > 0 && dash.total_ml >= dash.goal_ml);

  const applyDashboard = (snapshot: WaterDashboardSnapshot) => {
    queryClient.setQueryData(['v1', 'my', account.userId, 'water-dashboard'], (current: typeof dash) =>
      current
        ? {
            ...current,
            ...snapshot,
          }
        : current,
    );
  };

  const addMutation = useMutation({
    mutationFn: (input: { amount_ml: number; idempotency_key: string }) =>
      guarded(() => addWaterEntry(input)),
    networkMode: 'always',
    onSuccess: async (result) => {
      setErrorMessage(null);
      setRetryToken(null);
      applyDashboard(result.dashboard);
      await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'water-dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'water-week'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Nothing was logged. You can try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => guarded(() => deleteWaterEntry(id)),
    networkMode: 'always',
    onSuccess: async (result) => {
      setErrorMessage(null);
      applyDashboard(result.dashboard);
      await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'water-dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'water-week'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not undo that entry.');
    },
  });

  const goalMutation = useMutation({
    mutationFn: (goal: number) =>
      guarded(() =>
        updateWaterSettings({
          daily_goal_ml: goal,
          display_unit: (dash?.display_unit === 'L' ? 'L' : 'ml') as 'ml' | 'L',
        }),
      ),
    networkMode: 'always',
    onSuccess: async (result) => {
      setErrorMessage(null);
      setShowGoal(false);
      applyDashboard(result.dashboard);
      await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'water-dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['v1', 'my', account.userId, 'water-week'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not update your goal.');
    },
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'track') {
        setStep('welcome');
        return true;
      }
      goBackHome();
      return true;
    });
    return () => sub.remove();
  });

  const logAmount = (amount: number) => {
    if (!dash || addMutation.isPending) return;
    const key =
      retryToken && retryToken.amount === amount ? retryToken.key : newCompletionKey();
    setRetryToken({ key, amount });
    setErrorMessage(null);
    addMutation.mutate({ amount_ml: amount, idempotency_key: key });
  };

  const lastEntry = dash?.entries.length
    ? [...dash.entries].sort((a, b) => b.id - a.id)[0] ?? null
    : null;

  if (!account.enabled) {
    return (
      <CustomerPage onBack={goBackHome}>
        <IntroArt />
        <ToolStepHeader
          eyebrow="Water Intake Tracker"
          title="Stay Hydrated, Feel Better"
          body="Build a healthier hydration habit, one sip at a time."
          accent={toolPalette.tealDark}
          ink={toolPalette.navy}
        />
        <SignInToSave what="water intake" />
      </CustomerPage>
    );
  }

  if (dashboardQuery.isLoading) {
    return (
      <CustomerPage onBack={goBackHome}>
        <ActivityIndicator color={toolPalette.teal} style={{ marginTop: 40 }} />
      </CustomerPage>
    );
  }

  if (dashboardQuery.isError || !dash) {
    const closed =
      dashboardQuery.error instanceof MySpaceRequestError && dashboardQuery.error.status === 403;
    return (
      <CustomerPage onBack={goBackHome}>
        <StateCard
          icon={closed ? 'pause-circle-outline' : 'cloud-offline-outline'}
          title={closed ? 'Not available right now' : 'Could not load this tool'}
          body={
            closed
              ? 'This tool has been paused on YuktiOne. Please check back later.'
              : dashboardQuery.error?.message ?? 'Check your connection and try again.'
          }
          action={closed ? 'Back to tools' : 'Try again'}
          onAction={closed ? goBackHome : () => void dashboardQuery.refetch()}
        />
      </CustomerPage>
    );
  }

  const footer =
    step === 'welcome' ? (
      <PrimaryAction label="Start Tracking" icon="water-outline" onPress={() => setStep('track')} />
    ) : null;

  return (
    <CustomerPage
      onBack={() => (step === 'track' ? setStep('welcome') : goBackHome())}
      dismissKeyboardOnDrag
      footer={footer}
      right={
        step === 'track' ? (
          <IconButton
            icon="flag-outline"
            label="Edit daily goal"
            onPress={() => {
              if (!showGoal) setGoalDraft(String(dash.goal_ml));
              setShowGoal(!showGoal);
            }}
          />
        ) : undefined
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <IntroArt compact={step === 'track'} />
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
              title="Stay Hydrated, Feel Better"
              body="Build a healthier hydration habit, one sip at a time."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.welcomeNote}>
              <Ionicons name="lock-closed-outline" size={16} color={toolPalette.teal} />
              <Text style={styles.welcomeNoteText}>
                Logs save to your YuktiOne account — the same history as the website.
              </Text>
            </View>
          </FadeInView>
        ) : null}

        {step === 'track' ? (
          <FadeInView key="track" style={styles.step}>
            <ToolStepHeader
              title="Today’s hydration"
              body={`${dash.date} · Asia/Kolkata`}
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />

            <View style={styles.glassCard}>
              <WaterGlass percent={dash.percent} celebrate={celebrate} />
              <Text style={styles.totalLabel}>{dash.total_label}</Text>
              <Text style={styles.goalMeta}>
                Goal {dash.goal_label} · {dash.percent}% · {dash.remaining_label} left
              </Text>
              {celebrate ? <GoalReachedBanner /> : null}
            </View>

            <Text style={styles.sectionTitle}>Quick add</Text>
            <View style={styles.quickRow}>
              {dash.quick_adds.map((item) => (
                <PressableScale
                  key={item.ml}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.label}, ${item.ml} millilitres`}
                  disabled={addMutation.isPending}
                  onPress={() => logAmount(item.ml)}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickMl}>{item.ml}</Text>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </PressableScale>
              ))}
            </View>

            <View style={styles.customRow}>
              <TextInput
                value={customMl}
                onChangeText={setCustomMl}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="Custom ml"
                placeholderTextColor={toolPalette.muted}
                accessibilityLabel="Custom water amount in millilitres"
                style={styles.customInput}
              />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Add custom amount"
                disabled={addMutation.isPending}
                onPress={() => {
                  const amount = Number(customMl);
                  if (!Number.isInteger(amount)) {
                    setErrorMessage('Enter a whole number of millilitres.');
                    return;
                  }
                  if (amount < dash.entry_min_ml || amount > dash.entry_max_ml) {
                    setErrorMessage(
                      `Amount must be between ${dash.entry_min_ml} ml and ${dash.entry_max_ml} ml.`,
                    );
                    return;
                  }
                  setCustomMl('');
                  logAmount(amount);
                }}
                style={styles.customBtn}
              >
                <Text style={styles.customBtnText}>Add</Text>
              </PressableScale>
            </View>

            {lastEntry ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Undo last water entry"
                disabled={deleteMutation.isPending}
                onPress={() => deleteMutation.mutate(lastEntry.id)}
                style={styles.undoBtn}
              >
                <Ionicons name="arrow-undo-outline" size={16} color={toolPalette.teal} />
                <Text style={styles.undoText}>
                  Undo last {lastEntry.amount_ml} ml
                  {addMutation.isPending || deleteMutation.isPending ? '…' : ''}
                </Text>
              </Pressable>
            ) : null}

            {showGoal ? (
              <View style={styles.goalBox}>
                <Text style={styles.sectionTitle}>Daily goal</Text>
                <Text style={styles.goalHint}>
                  Personal preference only — not a medical prescription. Allowed{' '}
                  {dash.goal_min_ml}–{dash.goal_max_ml} ml.
                </Text>
                <View style={styles.customRow}>
                  <TextInput
                    value={goalDraft}
                    onChangeText={setGoalDraft}
                    keyboardType="number-pad"
                    maxLength={5}
                    accessibilityLabel="Daily goal in millilitres"
                    style={styles.customInput}
                  />
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Save daily goal"
                    disabled={goalMutation.isPending}
                    onPress={() => {
                      const goal = Number(goalDraft);
                      if (!Number.isInteger(goal)) {
                        setErrorMessage('Goal must be a whole number.');
                        return;
                      }
                      goalMutation.mutate(goal);
                    }}
                    style={styles.customBtn}
                  >
                    <Text style={styles.customBtnText}>
                      {goalMutation.isPending ? '…' : 'Save'}
                    </Text>
                  </PressableScale>
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Today’s log</Text>
            {dash.entries.length === 0 ? (
              <Text style={styles.emptyLog}>No water logged yet today.</Text>
            ) : (
              <View style={styles.logList}>
                {[...dash.entries].reverse().map((entry) => (
                  <View key={entry.id} style={styles.logRow}>
                    <Ionicons name="water-outline" size={16} color={toolPalette.teal} />
                    <Text style={styles.logAmount}>{entry.amount_ml} ml</Text>
                    <Text style={styles.logTime}>{formatStamp(entry.consumed_at)}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Last 7 days</Text>
            {weekQuery.isLoading ? (
              <ActivityIndicator color={toolPalette.teal} />
            ) : weekQuery.data ? (
              <View style={styles.weekRow}>
                {weekQuery.data.days.map((day) => {
                  const ratio =
                    day.goal_ml > 0 ? Math.min(day.total_ml / day.goal_ml, 1) : day.has_entries ? 1 : 0;
                  const barHeight = day.has_entries ? Math.max(Math.round(ratio * 88), 8) : 0;
                  return (
                    <View key={day.date} style={styles.weekDay}>
                      <View style={styles.weekBarTrack}>
                        <View
                          style={[
                            styles.weekBarFill,
                            {
                              height: barHeight,
                              backgroundColor: day.is_today ? toolPalette.teal : toolPalette.mintDeep,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.weekLabel, day.is_today && styles.weekLabelOn]}>
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyLog}>Week history unavailable.</Text>
            )}
            {weekQuery.data?.average_ml != null ? (
              <Text style={styles.avgText}>
                Average on logged days: {weekQuery.data.average_ml} ml
              </Text>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox} accessibilityLabel={errorMessage}>
                <Ionicons name="alert-circle" size={18} color={toolPalette.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {addMutation.isPending && !reduceMotion ? (
              <Text style={styles.savingNote}>Logging…</Text>
            ) : null}
          </FadeInView>
        ) : null}
      </KeyboardAvoidingView>
    </CustomerPage>
  );
}

function GoalReachedBanner() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withSequence(
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.96 + progress.value * 0.04 }],
  }));

  return (
    <Animated.View style={[styles.celebrate, style]}>
      <Ionicons name="sparkles-outline" size={18} color={toolPalette.tealDark} />
      <Text style={styles.celebrateText}>Daily goal reached — nice work staying hydrated.</Text>
    </Animated.View>
  );
}

function IntroArt({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.introArt, compact && styles.introArtCompact]}>
      <BrandGradient
        colors={[toolPalette.mint, toolPalette.lavender, toolPalette.cream]}
        angle={145}
        style={StyleSheet.absoluteFill}
      />
      <RemoteImage
        uri={resolveImageUrl(ILLUSTRATION)}
        resizeMode="contain"
        background="transparent"
        label="Water Intake Tracker"
        style={compact ? styles.introImageCompact : styles.introImage}
      />
    </View>
  );
}

function PrimaryAction({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.primary}
    >
      {icon ? <Ionicons name={icon} size={18} color={toolPalette.white} /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </PressableScale>
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

  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    ...shadows.md,
  },
  totalLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 28,
    color: toolPalette.navy,
    letterSpacing: -0.4,
  },
  goalMeta: {
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: toolPalette.muted,
    textAlign: 'center',
  },
  celebrate: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: toolPalette.mint,
  },
  celebrateText: {
    flex: 1,
    fontFamily: customerFonts.medium,
    fontSize: 13,
    color: toolPalette.tealDark,
  },

  sectionTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: toolPalette.navy,
    marginTop: 4,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickChip: {
    width: '47%',
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.cream,
    padding: 12,
    gap: 2,
    ...shadows.sm,
  },
  quickMl: {
    fontFamily: customerFonts.bold,
    fontSize: 20,
    color: toolPalette.tealDark,
  },
  quickLabel: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.body,
  },
  customRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  customInput: {
    flex: 1,
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
  customBtn: {
    minHeight: 48,
    minWidth: 72,
    borderRadius: 14,
    backgroundColor: toolPalette.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  customBtnText: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: toolPalette.white,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  undoText: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: toolPalette.teal,
  },

  goalBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 14,
    gap: 10,
  },
  goalHint: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: toolPalette.muted,
  },

  emptyLog: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: toolPalette.muted,
  },
  logList: { gap: 8 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: toolPalette.cream,
  },
  logAmount: {
    flex: 1,
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: toolPalette.navy,
  },
  logTime: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
  },

  weekRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    minHeight: 120,
  },
  weekDay: { flex: 1, alignItems: 'center', gap: 6 },
  weekBarTrack: {
    width: '100%',
    height: 88,
    borderRadius: 10,
    backgroundColor: toolPalette.line,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  weekBarFill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  weekLabel: {
    fontFamily: customerFonts.medium,
    fontSize: 11,
    color: toolPalette.muted,
  },
  weekLabelOn: {
    fontFamily: customerFonts.bold,
    color: toolPalette.navy,
  },
  avgText: {
    fontFamily: customerFonts.medium,
    fontSize: 12,
    color: toolPalette.muted,
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
  savingNote: {
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
  primaryText: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    color: toolPalette.white,
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
