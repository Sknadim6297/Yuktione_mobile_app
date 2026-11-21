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
import { newCompletionKey, useAccountScope } from '@/features/customer/myspace/accountData';
import { SignInToSave } from '@/features/customer/myspace/AccountTools';
import { customerActions } from '@/features/customer/store';
import { CustomerPage, IconButton } from '@/features/customer/ui';
import { ToolProgress } from '@/features/tools/chrome/ToolProgress';
import { ToolStepHeader } from '@/features/tools/chrome/ToolStepHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MySpaceRequestError } from '@/services/api/mySpace';
import {
  addNutritionEntry,
  deleteNutritionEntry,
  fetchNutritionDashboard,
  fetchNutritionInsights,
  fetchNutritionPortion,
  saveNutritionGoals,
  searchNutritionFoods,
  type NutritionFood,
  type NutritionPortionPreview,
} from '@/services/api/nutrition';
import { clearAuthToken } from '@/services/api/tokenStorage';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customerFonts, shadows, toolPalette } from '@/theme';

type Step = 'welcome' | 'dashboard' | 'search' | 'portion' | 'goals' | 'insights';

const STEPS = [
  { id: 'welcome', label: 'Start' },
  { id: 'dashboard', label: 'Today' },
  { id: 'search', label: 'Add' },
  { id: 'goals', label: 'Goals' },
  { id: 'insights', label: 'History' },
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

function fmtNutrient(value: string | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value}${suffix}`;
  const trimmed = n.toFixed(1).replace(/\.0$/, '');
  return `${trimmed}${suffix}`;
}

export function NutritionScreen() {
  const account = useAccountScope();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('welcome');
  const [date, setDate] = useState<string | undefined>(undefined);
  const [mealType, setMealType] = useState('breakfast');
  const [searchQ, setSearchQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [selectedFood, setSelectedFood] = useState<NutritionFood | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');
  const [servingId, setServingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<NutritionPortionPreview | null>(null);
  const [trackOnly, setTrackOnly] = useState(true);
  const [goalCalories, setGoalCalories] = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalCarbs, setGoalCarbs] = useState('');
  const [goalFat, setGoalFat] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [retryKey, setRetryKey] = useState<string | null>(null);
  const [insightsEnd, setInsightsEnd] = useState<string | undefined>(undefined);

  const dashQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'nutrition-dashboard', date ?? 'today'],
    queryFn: () => guarded(() => fetchNutritionDashboard(date)),
    enabled: account.enabled,
    retry: (count, error) =>
      !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2,
  });

  const searchQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'nutrition-search', submittedQ],
    queryFn: () => guarded(() => searchNutritionFoods({ q: submittedQ })),
    enabled: account.enabled && step === 'search',
  });

  const insightsQuery = useQuery({
    queryKey: ['v1', 'my', account.userId, 'nutrition-insights', insightsEnd ?? 'today'],
    queryFn: () => guarded(() => fetchNutritionInsights(insightsEnd)),
    enabled: account.enabled && step === 'insights',
  });

  const dashboard = dashQuery.data;

  const invalidateDash = async (nextDate?: string) => {
    await queryClient.invalidateQueries({
      queryKey: ['v1', 'my', account.userId, 'nutrition-dashboard'],
    });
    if (nextDate) setDate(nextDate);
  };

  const logMutation = useMutation({
    mutationFn: (input: {
      food_id: number;
      meal_type: string;
      quantity: string;
      unit: string;
      serving_id?: number | null;
      idempotency_key: string;
    }) => guarded(() => addNutritionEntry(input)),
    networkMode: 'always',
    onSuccess: async (result) => {
      setErrorMessage(null);
      setRetryKey(null);
      setSavedFlash(true);
      setSelectedFood(null);
      setPreview(null);
      setStep('dashboard');
      await invalidateDash(result.dashboard.date);
      await queryClient.invalidateQueries({
        queryKey: ['v1', 'my', account.userId, 'nutrition-insights'],
      });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Nothing was logged. You can try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => guarded(() => deleteNutritionEntry(id)),
    networkMode: 'always',
    onSuccess: async () => {
      setErrorMessage(null);
      await invalidateDash();
      await queryClient.invalidateQueries({
        queryKey: ['v1', 'my', account.userId, 'nutrition-insights'],
      });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not remove that entry.');
    },
  });

  const goalsMutation = useMutation({
    mutationFn: () =>
      guarded(() =>
        saveNutritionGoals({
          track_only: trackOnly,
          calories_kcal: trackOnly || !goalCalories ? null : Number(goalCalories),
          protein_g: trackOnly || !goalProtein ? null : goalProtein,
          carbs_g: trackOnly || !goalCarbs ? null : goalCarbs,
          fat_g: trackOnly || !goalFat ? null : goalFat,
        }),
      ),
    networkMode: 'always',
    onSuccess: async () => {
      setErrorMessage(null);
      setSavedFlash(true);
      setStep('dashboard');
      await invalidateDash();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Could not save goals.');
    },
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      guarded(() =>
        fetchNutritionPortion({
          foodId: selectedFood!.id,
          quantity,
          unit,
          serving_id: servingId,
        }),
      ),
    onSuccess: (result) => {
      setErrorMessage(null);
      setPreview(result.preview);
      setSelectedFood(result.food);
    },
    onError: (error: Error) => {
      setPreview(null);
      setErrorMessage(error.message || 'Could not estimate this portion.');
    },
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'welcome') {
        goBackHome();
        return true;
      }
      if (step === 'portion') {
        setStep('search');
        return true;
      }
      if (step === 'search' || step === 'goals' || step === 'insights') {
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

  const openGoals = () => {
    if (dashboard) {
      setTrackOnly(dashboard.goals.track_only);
      setGoalCalories(dashboard.goals.calories_kcal ? String(dashboard.goals.calories_kcal) : '');
      setGoalProtein(dashboard.goals.protein_g?.replace(/\.?0+$/, '') || '');
      setGoalCarbs(dashboard.goals.carbs_g?.replace(/\.?0+$/, '') || '');
      setGoalFat(dashboard.goals.fat_g?.replace(/\.?0+$/, '') || '');
    }
    setErrorMessage(null);
    setStep('goals');
  };

  const openSearch = (meal?: string) => {
    if (meal) setMealType(meal);
    setErrorMessage(null);
    setStep('search');
  };

  const openPortion = (food: NutritionFood) => {
    setSelectedFood(food);
    setServingId(food.servings[0]?.id ?? null);
    if (food.servings[0]) {
      setQuantity(food.servings[0].quantity.replace(/\.?0+$/, '') || '1');
      setUnit(food.servings[0].unit);
    } else if (food.reference_basis === 'per_100ml') {
      setQuantity('100');
      setUnit('ml');
    } else {
      setQuantity('100');
      setUnit('g');
    }
    setPreview(null);
    setErrorMessage(null);
    setStep('portion');
  };

  const saveEntry = () => {
    if (!selectedFood) return;
    const key = retryKey ?? newCompletionKey();
    setRetryKey(key);
    logMutation.mutate({
      food_id: selectedFood.id,
      meal_type: mealType,
      quantity,
      unit,
      serving_id: servingId,
      idempotency_key: key,
    });
  };

  const confirmDelete = (id: number, label: string) => {
    Alert.alert('Remove entry?', `${label} will be removed from this day.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const progressCurrent = step === 'portion' ? 'search' : step;

  const remainingLabel = (() => {
    if (!dashboard?.progress.meaningful || dashboard.progress.remaining_kcal === null) return null;
    const rem = Number(dashboard.progress.remaining_kcal);
    if (!Number.isFinite(rem)) return null;
    if (rem >= 0) return `${rem} kcal remaining toward optional goal`;
    return `${Math.abs(rem)} kcal over optional goal`;
  })();

  if (!account.enabled) {
    return (
      <CustomerPage onBack={goBackHome}>
        <IntroArt />
        <ToolStepHeader
          eyebrow="Calorie & Nutrition"
          title="Nourish Your Everyday"
          body="Understand your nutrition and build habits that work for you."
          accent={toolPalette.tealDark}
          ink={toolPalette.navy}
        />
        <SignInToSave what="calorie and nutrition tracking" />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage
      onBack={() => {
        if (step === 'welcome') goBackHome();
        else if (step === 'portion') setStep('search');
        else if (step === 'dashboard') setStep('welcome');
        else setStep('dashboard');
      }}
      dismissKeyboardOnDrag
      right={
        step === 'dashboard' ? (
          <IconButton icon="add-circle-outline" label="Add food" onPress={() => openSearch()} />
        ) : undefined
      }
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <IntroArt compact={step !== 'welcome'} />
        <ToolProgress
          steps={[...STEPS]}
          current={progressCurrent}
          accent={toolPalette.teal}
          accentSoft={toolPalette.mintDeep}
          ink={toolPalette.navy}
        />

        {step === 'welcome' ? (
          <FadeInView key="welcome" style={styles.step}>
            <ToolStepHeader
              eyebrow="Calorie & Nutrition"
              title="Nourish Your Everyday"
              body="Understand your nutrition and build habits that work for you."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.note}>
              <Ionicons name="leaf-outline" size={16} color={toolPalette.teal} />
              <Text style={styles.noteText}>
                Log published catalogue foods with source-backed portions. Totals come only from your
                saved entries—never sample data.
              </Text>
            </View>
            <PrimaryAction
              label="Start Tracking"
              icon="restaurant-outline"
              onPress={() => setStep('dashboard')}
            />
          </FadeInView>
        ) : null}

        {step === 'dashboard' ? (
          <FadeInView key="dashboard" style={styles.step}>
            <ToolStepHeader
              title="Today’s nourishment"
              body="Neutral totals from meals you logged."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            {savedFlash ? <SavedBanner reduceMotion={reduceMotion} /> : null}
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}

            {dashQuery.isLoading && !dashboard ? (
              <ActivityIndicator color={toolPalette.teal} style={{ marginTop: 24 }} />
            ) : dashQuery.isError ? (
              <StateCard
                icon="cloud-offline-outline"
                title="Couldn’t load nutrition"
                body={dashQuery.error instanceof Error ? dashQuery.error.message : 'Try again.'}
                action="Retry"
                onAction={() => void dashQuery.refetch()}
              />
            ) : dashboard ? (
              <>
                <View style={styles.dateRow}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Previous day"
                    onPress={() => setDate(dashboard.prev_date)}
                    style={styles.dateChip}
                  >
                    <Ionicons name="chevron-back" size={16} color={toolPalette.tealDark} />
                  </PressableScale>
                  <Text style={styles.dateLabel}>{dashboard.date}</Text>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Next day"
                    disabled={dashboard.is_today}
                    onPress={() => !dashboard.is_today && setDate(dashboard.next_date)}
                    style={[styles.dateChip, dashboard.is_today && styles.dateChipDisabled]}
                  >
                    <Ionicons name="chevron-forward" size={16} color={toolPalette.tealDark} />
                  </PressableScale>
                </View>

                <View style={styles.heroCard}>
                  <CalorieRing
                    percent={dashboard.progress.ring_percent}
                    displayPercent={dashboard.progress.percent}
                    meaningful={dashboard.progress.meaningful}
                    caloriesLabel={fmtNutrient(dashboard.totals.calories_kcal)}
                    goal={dashboard.progress.calories_goal_kcal}
                    reduceMotion={reduceMotion}
                  />
                  {remainingLabel ? <Text style={styles.heroMeta}>{remainingLabel}</Text> : null}
                  {dashboard.progress.track_only ? (
                    <Text style={styles.heroMeta}>Tracking only — no calorie goal applied</Text>
                  ) : null}
                </View>

                <View style={styles.macroRow}>
                  <MacroCard label="Calories" value={fmtNutrient(dashboard.totals.calories_kcal)} />
                  <MacroCard label="Protein" value={fmtNutrient(dashboard.totals.protein_g, ' g')} />
                  <MacroCard label="Carbs" value={fmtNutrient(dashboard.totals.carbs_g, ' g')} />
                  <MacroCard label="Fat" value={fmtNutrient(dashboard.totals.fat_g, ' g')} />
                </View>

                {!dashboard.has_entries ? (
                  <Text style={styles.empty}>
                    No meals logged for this date. Empty does not mean nothing was eaten.
                  </Text>
                ) : null}
                {dashboard.has_incomplete ? (
                  <Text style={styles.hint}>Some entries have incomplete nutrient data.</Text>
                ) : null}
                {dashboard.catalogue_count === 0 ? (
                  <Text style={styles.hint}>
                    Food catalogue pending. Logging unlocks after published foods are available.
                  </Text>
                ) : null}

                <View style={styles.actionRow}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Add food"
                    onPress={() => openSearch()}
                    style={styles.actionChip}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={toolPalette.tealDark} />
                    <Text style={styles.actionText}>Add food</Text>
                  </PressableScale>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Edit goals"
                    onPress={openGoals}
                    style={styles.actionChip}
                  >
                    <Ionicons name="flag-outline" size={18} color={toolPalette.tealDark} />
                    <Text style={styles.actionText}>Goals</Text>
                  </PressableScale>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="View history"
                    onPress={() => {
                      setInsightsEnd(dashboard.date);
                      setStep('insights');
                    }}
                    style={styles.actionChip}
                  >
                    <Ionicons name="stats-chart-outline" size={18} color={toolPalette.tealDark} />
                    <Text style={styles.actionText}>History</Text>
                  </PressableScale>
                </View>

                <Text style={styles.sectionTitle}>Meals</Text>
                {dashboard.by_meal.map((meal) => (
                  <View key={meal.key} style={styles.mealCard}>
                    <View style={styles.mealHead}>
                      <Text style={styles.mealTitle}>{meal.label}</Text>
                      <Text style={styles.mealKcal}>
                        {fmtNutrient(meal.totals.calories_kcal)} kcal
                      </Text>
                    </View>
                    <Text style={styles.mealMeta}>
                      {meal.entry_count} item{meal.entry_count === 1 ? '' : 's'}
                    </Text>
                    {meal.entries.map((entry) => (
                      <View key={entry.id} style={styles.entryRow}>
                        <View style={styles.grow}>
                          <Text style={styles.entryName}>{entry.food_name}</Text>
                          <Text style={styles.entryMeta}>
                            {entry.quantity} {entry.unit} · {fmtNutrient(entry.calories_kcal)} kcal
                            {entry.incomplete_nutrients ? ' · incomplete' : ''}
                          </Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${entry.food_name}`}
                          onPress={() => confirmDelete(entry.id, entry.food_name)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={18} color={toolPalette.danger} />
                        </Pressable>
                      </View>
                    ))}
                    <TextLink label="Add to this meal" onPress={() => openSearch(meal.key)} />
                  </View>
                ))}
              </>
            ) : null}
          </FadeInView>
        ) : null}

        {step === 'search' ? (
          <FadeInView key="search" style={styles.step}>
            <ToolStepHeader
              title="Find a food"
              body="Search the published catalogue. No invented nutrition values."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <View style={styles.mealPick}>
              {(dashboard?.meals ?? [
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch', label: 'Lunch' },
                { key: 'dinner', label: 'Dinner' },
                { key: 'snacks', label: 'Snacks' },
              ]).map((meal) => (
                <PressableScale
                  key={meal.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mealType === meal.key }}
                  onPress={() => setMealType(meal.key)}
                  style={[styles.mealChip, mealType === meal.key && styles.mealChipOn]}
                >
                  <Text style={[styles.mealChipText, mealType === meal.key && styles.mealChipTextOn]}>
                    {meal.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={searchQ}
              onChangeText={setSearchQ}
              placeholder="Search name, brand, or variant"
              placeholderTextColor={toolPalette.muted}
              returnKeyType="search"
              onSubmitEditing={() => setSubmittedQ(searchQ.trim())}
              accessibilityLabel="Search foods"
            />
            <PrimaryAction label="Search" onPress={() => setSubmittedQ(searchQ.trim())} />
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}
            {searchQuery.isFetching ? (
              <ActivityIndicator color={toolPalette.teal} />
            ) : searchQuery.data ? (
              searchQuery.data.foods.length === 0 ? (
                <Text style={styles.empty}>
                  {searchQuery.data.catalogue_count === 0
                    ? 'Food catalogue pending.'
                    : 'No matching published foods.'}
                </Text>
              ) : (
                searchQuery.data.foods.map((food) => (
                  <PressableScale
                    key={food.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${food.name}`}
                    onPress={() => openPortion(food)}
                    style={styles.foodRow}
                  >
                    <View style={styles.grow}>
                      <Text style={styles.entryName}>{food.name}</Text>
                      <Text style={styles.entryMeta}>
                        {[food.brand, food.variant, food.category?.name]
                          .filter(Boolean)
                          .join(' · ') || food.reference_basis}
                        {food.calories_kcal
                          ? ` · ${fmtNutrient(food.calories_kcal)} kcal / ref`
                          : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={toolPalette.muted} />
                  </PressableScale>
                ))
              )
            ) : null}
            <TextLink label="Back" onPress={() => setStep('dashboard')} />
          </FadeInView>
        ) : null}

        {step === 'portion' && selectedFood ? (
          <FadeInView key="portion" style={styles.step}>
            <ToolStepHeader
              title={selectedFood.name}
              body="Portion estimates use the website calculator. Educational only—not medical advice."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            {selectedFood.servings.length > 0 ? (
              <View style={styles.mealPick}>
                {selectedFood.servings.map((serving) => (
                  <PressableScale
                    key={serving.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: servingId === serving.id }}
                    onPress={() => {
                      setServingId(serving.id);
                      setQuantity(serving.quantity.replace(/\.?0+$/, '') || '1');
                      setUnit(serving.unit);
                      setPreview(null);
                    }}
                    style={[styles.mealChip, servingId === serving.id && styles.mealChipOn]}
                  >
                    <Text
                      style={[
                        styles.mealChipText,
                        servingId === serving.id && styles.mealChipTextOn,
                      ]}
                    >
                      {serving.label}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            ) : null}
            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={(text) => {
                setQuantity(text);
                setPreview(null);
              }}
              keyboardType="decimal-pad"
              accessibilityLabel="Quantity"
            />
            <Text style={styles.fieldLabel}>Unit</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={(text) => {
                setUnit(text);
                setPreview(null);
              }}
              autoCapitalize="none"
              accessibilityLabel="Unit"
            />
            <PrimaryAction
              label="Preview portion"
              onPress={() => previewMutation.mutate()}
              loading={previewMutation.isPending}
            />
            {preview ? (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Estimated for this portion</Text>
                <Text style={styles.previewValue}>
                  {fmtNutrient(preview.calories_kcal)} kcal
                </Text>
                <Text style={styles.entryMeta}>
                  P {fmtNutrient(preview.protein_g)} · C {fmtNutrient(preview.carbs_g)} · F{' '}
                  {fmtNutrient(preview.fat_g)}
                  {preview.incomplete ? ' · incomplete nutrients' : ''}
                </Text>
              </View>
            ) : null}
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}
            <PrimaryAction
              label={logMutation.isPending ? 'Saving…' : 'Save to meal'}
              onPress={saveEntry}
              loading={logMutation.isPending}
              disabled={!quantity.trim() || !unit.trim()}
            />
            <TextLink label="Back to search" onPress={() => setStep('search')} />
          </FadeInView>
        ) : null}

        {step === 'goals' ? (
          <FadeInView key="goals" style={styles.step}>
            <ToolStepHeader
              title="Optional goals"
              body="Personal targets only. Never prescriptions or medical advice."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            <PressableScale
              accessibilityRole="checkbox"
              accessibilityState={{ checked: trackOnly }}
              onPress={() => setTrackOnly((v) => !v)}
              style={[styles.checkRow, trackOnly && styles.checkRowOn]}
            >
              <Ionicons
                name={trackOnly ? 'checkbox' : 'square-outline'}
                size={22}
                color={toolPalette.tealDark}
              />
              <Text style={styles.checkText}>Track only (no calorie or macro goals)</Text>
            </PressableScale>
            {!trackOnly ? (
              <>
                <Text style={styles.fieldLabel}>Daily calories (kcal) · 500–10000</Text>
                <TextInput
                  style={styles.input}
                  value={goalCalories}
                  onChangeText={setGoalCalories}
                  keyboardType="number-pad"
                  placeholder="Optional"
                  placeholderTextColor={toolPalette.muted}
                  accessibilityLabel="Daily calories"
                />
                <Text style={styles.fieldLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={goalProtein}
                  onChangeText={setGoalProtein}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                  placeholderTextColor={toolPalette.muted}
                />
                <Text style={styles.fieldLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={goalCarbs}
                  onChangeText={setGoalCarbs}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                  placeholderTextColor={toolPalette.muted}
                />
                <Text style={styles.fieldLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  value={goalFat}
                  onChangeText={setGoalFat}
                  keyboardType="decimal-pad"
                  placeholder="Optional"
                  placeholderTextColor={toolPalette.muted}
                />
              </>
            ) : null}
            {errorMessage ? <ErrorBox message={errorMessage} /> : null}
            <PrimaryAction
              label={goalsMutation.isPending ? 'Saving…' : 'Save goals'}
              onPress={() => goalsMutation.mutate()}
              loading={goalsMutation.isPending}
            />
            <TextLink label="Back" onPress={() => setStep('dashboard')} />
          </FadeInView>
        ) : null}

        {step === 'insights' ? (
          <FadeInView key="insights" style={styles.step}>
            <ToolStepHeader
              title="7-day history"
              body="Calories from real meal entries only."
              accent={toolPalette.tealDark}
              ink={toolPalette.navy}
            />
            {insightsQuery.isLoading ? (
              <ActivityIndicator color={toolPalette.teal} />
            ) : insightsQuery.isError ? (
              <StateCard
                icon="cloud-offline-outline"
                title="Couldn’t load history"
                body={
                  insightsQuery.error instanceof Error
                    ? insightsQuery.error.message
                    : 'Try again.'
                }
                action="Retry"
                onAction={() => void insightsQuery.refetch()}
              />
            ) : insightsQuery.data ? (
              <>
                <WeekChart days={insightsQuery.data.days} />
                {insightsQuery.data.days.map((day) => (
                  <PressableScale
                    key={day.date}
                    accessibilityRole="button"
                    onPress={() => {
                      setDate(day.date);
                      setStep('dashboard');
                    }}
                    style={styles.dayRow}
                  >
                    <Text style={styles.dayLabel}>
                      {day.label} · {day.date}
                    </Text>
                    <Text style={styles.dayKcal}>
                      {day.has_entries ? `${fmtNutrient(day.calories_kcal)} kcal` : '—'}
                    </Text>
                  </PressableScale>
                ))}
                <TextLink
                  label="Previous week"
                  onPress={() => setInsightsEnd(insightsQuery.data.prev_end)}
                />
              </>
            ) : null}
            <TextLink label="Back to journey" onPress={() => setStep('dashboard')} />
          </FadeInView>
        ) : null}
      </KeyboardAvoidingView>
    </CustomerPage>
  );
}

function CalorieRing({
  percent,
  displayPercent,
  meaningful,
  caloriesLabel,
  goal,
  reduceMotion,
}: {
  percent: number | null;
  displayPercent: number | null;
  meaningful: boolean;
  caloriesLabel: string;
  goal: number | null;
  reduceMotion: boolean;
}) {
  const width = useSharedValue(0);
  useEffect(() => {
    const target = meaningful && percent !== null ? percent : 0;
    width.value = withTiming(target, {
      duration: reduceMotion ? 0 : 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [meaningful, percent, reduceMotion, width]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.ringWrap} accessibilityRole="image">
      {meaningful ? (
        <View style={styles.ringTrack}>
          <Animated.View style={[styles.ringFill, fillStyle]} />
          <Text style={styles.ringLabel}>{displayPercent ?? 0}%</Text>
        </View>
      ) : null}
      <Text style={styles.heroValue}>{caloriesLabel} kcal</Text>
      {goal ? <Text style={styles.heroMeta}>of {goal} optional goal</Text> : null}
    </View>
  );
}

function WeekChart({
  days,
}: {
  days: { date: string; label: string; calories_kcal: string | null; has_entries: boolean }[];
}) {
  const max = Math.max(
    1,
    ...days.map((d) => (d.calories_kcal ? Number(d.calories_kcal) : 0)).filter((n) => Number.isFinite(n)),
  );
  return (
    <View style={styles.chartCard}>
      {days.map((day) => {
        const value = day.calories_kcal ? Number(day.calories_kcal) : 0;
        const height = day.has_entries && value > 0 ? Math.max(8, Math.round((value / max) * 88)) : 4;
        return (
          <View key={day.date} style={styles.chartCol}>
            <View style={[styles.chartBar, { height }]} />
            <Text style={styles.chartLabel}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MacroCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
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
        label="Calorie and Nutrition"
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
  ringWrap: { width: '100%', alignItems: 'center', gap: 8 },
  ringTrack: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    backgroundColor: toolPalette.line,
    overflow: 'hidden',
    justifyContent: 'center',
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
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: toolPalette.navy,
    textAlign: 'center',
    zIndex: 1,
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

  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  dateChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: toolPalette.mint,
  },
  dateChipDisabled: { opacity: 0.35 },
  dateLabel: {
    fontFamily: customerFonts.semibold,
    fontSize: 15,
    color: toolPalette.navy,
    minWidth: 110,
    textAlign: 'center',
  },

  macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroCard: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: toolPalette.cream,
  },
  macroLabel: {
    fontFamily: customerFonts.medium,
    fontSize: 11,
    color: toolPalette.muted,
  },
  macroValue: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: toolPalette.navy,
    marginTop: 4,
  },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: toolPalette.mint,
  },
  actionText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: toolPalette.tealDark,
  },

  sectionTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 17,
    color: toolPalette.navy,
    marginTop: 4,
  },
  mealCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
    padding: 14,
    gap: 8,
  },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitle: { fontFamily: customerFonts.bold, fontSize: 16, color: toolPalette.navy },
  mealKcal: { fontFamily: customerFonts.semibold, fontSize: 13, color: toolPalette.tealDark },
  mealMeta: { fontFamily: customerFonts.medium, fontSize: 12, color: toolPalette.muted },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: toolPalette.line,
  },
  entryName: { fontFamily: customerFonts.semibold, fontSize: 14, color: toolPalette.navy },
  entryMeta: { fontFamily: customerFonts.regular, fontSize: 12, color: toolPalette.muted },

  mealPick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.cream,
  },
  mealChipOn: {
    backgroundColor: toolPalette.mint,
    borderColor: toolPalette.teal,
  },
  mealChipText: { fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.navy },
  mealChipTextOn: { color: toolPalette.tealDark, fontFamily: customerFonts.semibold },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: toolPalette.white,
    borderWidth: 1,
    borderColor: toolPalette.line,
  },

  fieldLabel: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: toolPalette.navy,
  },
  input: {
    borderWidth: 1,
    borderColor: toolPalette.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontFamily: customerFonts.regular,
    fontSize: 16,
    color: toolPalette.navy,
    backgroundColor: toolPalette.white,
  },

  previewCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: toolPalette.mint,
    gap: 4,
  },
  previewTitle: { fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.tealDark },
  previewValue: { fontFamily: customerFonts.bold, fontSize: 22, color: toolPalette.navy },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: toolPalette.line,
    backgroundColor: toolPalette.white,
  },
  checkRowOn: { backgroundColor: toolPalette.mint, borderColor: toolPalette.teal },
  checkText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 14, color: toolPalette.navy },

  chartCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    height: 120,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 16,
    borderRadius: 18,
    backgroundColor: toolPalette.white,
    borderWidth: 1,
    borderColor: toolPalette.line,
  },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  chartBar: {
    width: '70%',
    borderRadius: 8,
    backgroundColor: toolPalette.teal,
    minHeight: 4,
  },
  chartLabel: { fontFamily: customerFonts.medium, fontSize: 10, color: toolPalette.muted },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: toolPalette.line,
  },
  dayLabel: { fontFamily: customerFonts.medium, fontSize: 14, color: toolPalette.navy },
  dayKcal: { fontFamily: customerFonts.semibold, fontSize: 14, color: toolPalette.tealDark },

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

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: toolPalette.mint,
  },
  savedText: { fontFamily: customerFonts.semibold, fontSize: 14, color: toolPalette.tealDark },

  errorBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
  },
  errorText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 13, color: toolPalette.danger },

  empty: { fontFamily: customerFonts.medium, fontSize: 14, color: toolPalette.muted, lineHeight: 20 },
  hint: { fontFamily: customerFonts.regular, fontSize: 13, color: toolPalette.muted, lineHeight: 18 },

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
