import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { FadeInView } from '@/components/motion';
import {
  Button,
  EmptyState,
  Input,
  LoadingSkeleton,
  Screen,
} from '@/components/ui';
import { isApiConfigured } from '@/constants';
import {
  currentMonthKey,
  fetchAvailableDates,
  fetchAvailableSlots,
  fetchProfessionalAvailability,
  formatMonthLabel,
  shiftMonthKey,
} from '@/services/api';
import { openWebsitePath } from '@/services/website/openWebsite';
import { colors, radius, shadows, spacing, typography } from '@/theme';

const AVAILABILITY_HREF = '/explore/availability' as Href;

function parseProfessionalId(
  raw: string | string[] | undefined,
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return null;
  }
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function AvailabilityExplorerScreen() {
  const params = useLocalSearchParams<{ professionalId?: string }>();
  const paramId = parseProfessionalId(params.professionalId);

  const [idInput, setIdInput] = useState(paramId ? String(paramId) : '');
  const [professionalId, setProfessionalId] = useState<number | null>(paramId);
  const [month, setMonth] = useState(currentMonthKey());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | undefined>();

  const apiReady = isApiConfigured();
  const canQuery = Boolean(professionalId && apiReady);

  const datesQuery = useQuery({
    queryKey: ['availability', 'dates', professionalId, month],
    enabled: canQuery,
    queryFn: async ({ signal }) => {
      const id = professionalId as number;
      const [datesResult, monthResult] = await Promise.all([
        fetchAvailableDates(id, month, signal),
        fetchProfessionalAvailability(id, month, signal),
      ]);

      if (!datesResult.ok) {
        throw new Error(
          datesResult.error.message ?? 'Could not load available dates.',
        );
      }

      let monthMessage: string | null = null;
      let professionalName: string | null = null;
      let sessionDuration: number | null = null;

      if (monthResult.ok) {
        if (monthResult.data.success && monthResult.data.data) {
          professionalName = monthResult.data.data.professional.name?.trim() || null;
          sessionDuration = monthResult.data.data.availability.session_duration;
        } else if (!monthResult.data.success) {
          monthMessage =
            monthResult.data.message ?? 'No availability found for this month';
        }
      }

      return {
        dates: datesResult.data.data ?? [],
        monthMessage,
        professionalName,
        sessionDuration,
      };
    },
  });

  const slotsQuery = useQuery({
    queryKey: ['availability', 'slots', professionalId, selectedDate],
    enabled: Boolean(canQuery && selectedDate),
    queryFn: async ({ signal }) => {
      const id = professionalId as number;
      const date = selectedDate as string;
      const result = await fetchAvailableSlots(id, date, signal);
      if (!result.ok) {
        throw new Error(result.error.message ?? 'Could not load slots.');
      }
      return result.data.data;
    },
  });

  const applyProfessionalId = () => {
    const n = Number(idInput.trim());
    if (!Number.isInteger(n) || n <= 0) {
      setIdError('Enter a valid positive professional ID.');
      return;
    }
    setIdError(undefined);
    setProfessionalId(n);
    setSelectedDate(null);
    router.setParams({ professionalId: String(n) });
  };

  const professionalLabel = useMemo(() => {
    if (datesQuery.data?.professionalName) {
      return datesQuery.data.professionalName;
    }
    if (professionalId) {
      return `Professional #${professionalId}`;
    }
    return 'No professional selected';
  }, [datesQuery.data?.professionalName, professionalId]);

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader
        title="Availability preview"
        subtitle="Public schedule from Laravel /api"
      />

      <InfoBanner
        tone="warning"
        title="Schedule preview only"
        message="This uses public availability endpoints. It does not confirm professional approval status or complete a booking. Book and pay on the YuktiOne website."
      />

      {!apiReady ? (
        <InfoBanner
          tone="warning"
          title="Laravel origin not configured"
          message="Set EXPO_PUBLIC_API_BASE_URL to your Laravel origin (without /api), e.g. http://10.0.2.2/.../public for Android emulator."
        />
      ) : null}

      <FadeInView style={styles.card}>
        <Text style={styles.sectionTitle}>Professional ID</Text>
        <Text style={styles.hint}>
          Required — not hardcoded. Pass via navigation or enter a known ID.
        </Text>
        <Input
          label="ID"
          value={idInput}
          onChangeText={setIdInput}
          keyboardType="number-pad"
          accessibilityLabel="Professional ID"
          placeholder="e.g. 12"
          error={idError}
          returnKeyType="done"
          onSubmitEditing={applyProfessionalId}
        />
        <Button title="Load availability" onPress={applyProfessionalId} />
        <Text style={styles.meta}>{professionalLabel}</Text>
      </FadeInView>

      {professionalId ? (
        <FadeInView delayMs={40} style={styles.card}>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              hitSlop={12}
              onPress={() => {
                setMonth((m) => shiftMonthKey(m, -1));
                setSelectedDate(null);
              }}
              style={styles.monthNav}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.brand.eucalyptus}
              />
            </Pressable>
            <Text style={styles.monthLabel}>{formatMonthLabel(month)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              hitSlop={12}
              onPress={() => {
                setMonth((m) => shiftMonthKey(m, 1));
                setSelectedDate(null);
              }}
              style={styles.monthNav}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.brand.eucalyptus}
              />
            </Pressable>
          </View>

          {datesQuery.isFetching ? (
            <View style={styles.skeletonBlock}>
              <LoadingSkeleton height={18} width="50%" />
              <LoadingSkeleton height={40} />
              <LoadingSkeleton height={40} />
            </View>
          ) : null}

          {datesQuery.isError ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>
                {datesQuery.error instanceof Error
                  ? datesQuery.error.message
                  : 'Could not load available dates.'}
              </Text>
              <Button title="Retry" onPress={() => void datesQuery.refetch()} />
            </View>
          ) : null}

          {!datesQuery.isFetching &&
          !datesQuery.isError &&
          datesQuery.data?.monthMessage ? (
            <Text style={styles.hint}>{datesQuery.data.monthMessage}</Text>
          ) : null}

          {!datesQuery.isFetching &&
          !datesQuery.isError &&
          (datesQuery.data?.dates.length ?? 0) === 0 ? (
            <EmptyState
              title="No dates this month"
              description="The public API returned no available dates for this professional and month."
            />
          ) : null}

          {!datesQuery.isFetching &&
          !datesQuery.isError &&
          (datesQuery.data?.dates.length ?? 0) > 0 ? (
            <View style={styles.dateGrid}>
              {datesQuery.data?.dates.map((date) => {
                const selected = date === selectedDate;
                return (
                  <Pressable
                    key={date}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Select ${date}`}
                    onPress={() => setSelectedDate(date)}
                    style={[styles.dateChip, selected && styles.dateChipSelected]}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        selected && styles.dateChipTextSelected,
                      ]}
                    >
                      {date.slice(8)}
                    </Text>
                    <Text
                      style={[
                        styles.dateChipSub,
                        selected && styles.dateChipTextSelected,
                      ]}
                    >
                      {date.slice(5, 7)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </FadeInView>
      ) : null}

      {selectedDate ? (
        <FadeInView delayMs={60} style={styles.card}>
          <Text style={styles.sectionTitle}>Slots · {selectedDate}</Text>
          {slotsQuery.data ? (
            <Text style={styles.hint}>
              {slotsQuery.data.weekday.toUpperCase()} ·{' '}
              {slotsQuery.data.session_duration} min sessions
            </Text>
          ) : null}

          {slotsQuery.isFetching ? (
            <View style={styles.skeletonBlock}>
              <LoadingSkeleton height={48} />
              <LoadingSkeleton height={48} />
            </View>
          ) : null}

          {slotsQuery.isError ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>
                {slotsQuery.error instanceof Error
                  ? slotsQuery.error.message
                  : 'Could not load slots.'}
              </Text>
              <Button title="Retry" onPress={() => void slotsQuery.refetch()} />
            </View>
          ) : null}

          {!slotsQuery.isFetching &&
          !slotsQuery.isError &&
          (slotsQuery.data?.slots.length ?? 0) === 0 ? (
            <EmptyState
              title="No open slots"
              description="No free slots were returned for this date (may be fully booked or in the past)."
            />
          ) : null}

          {!slotsQuery.isFetching &&
            !slotsQuery.isError &&
            slotsQuery.data?.slots.map((slot) => (
              <View
                key={`${slot.start_time}-${slot.end_time}`}
                style={styles.slotRow}
              >
                <Text style={styles.slotTime}>
                  {slot.start_time} – {slot.end_time}
                </Text>
                <Text style={styles.slotDuration}>{slot.duration} min</Text>
              </View>
            ))}
        </FadeInView>
      ) : null}

      <FadeInView delayMs={80} style={styles.card}>
        <Text style={styles.sectionTitle}>Continue on website</Text>
        <Text style={styles.hint}>
          Opens the system browser. No login or payment is automated in the app.
        </Text>
        <View style={styles.webActions}>
          <Button
            title="Customer login (website)"
            onPress={() => {
              void openWebsitePath('customerLogin');
            }}
          />
          <Button
            title="Professional login (website)"
            variant="secondary"
            onPress={() => {
              void openWebsitePath('professionalLogin');
            }}
          />
          <Button
            title="Customer register (website)"
            variant="ghost"
            onPress={() => {
              void openWebsitePath('customerRegister');
            }}
          />
          <Button
            title="Professional register (website)"
            variant="ghost"
            onPress={() => {
              void openWebsitePath('professionalRegister');
            }}
          />
          <Button
            title="Explore professionals (website)"
            variant="ghost"
            onPress={() => {
              void openWebsitePath('exploreListing');
            }}
          />
          <Button
            title="Booking page (website)"
            variant="ghost"
            onPress={() => {
              void openWebsitePath('customerBooking', {
                message:
                  'Opens /user/booking in your browser. You must sign in on the website. Payment is not started from the app.',
              });
            }}
          />
        </View>
      </FadeInView>
    </Screen>
  );
}

export { AVAILABILITY_HREF };

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  meta: {
    ...typography.bodyStrong,
    color: colors.brand.eucalyptus,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  monthNav: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.brand.eucalyptusSoft,
  },
  monthLabel: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateChip: {
    minWidth: 52,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.canvas,
  },
  dateChipSelected: {
    backgroundColor: colors.brand.eucalyptus,
    borderColor: colors.brand.eucalyptus,
  },
  dateChipText: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  dateChipSub: {
    ...typography.caption,
    color: colors.text.muted,
  },
  dateChipTextSelected: {
    color: colors.text.inverse,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background.canvas,
  },
  slotTime: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  slotDuration: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  skeletonBlock: {
    gap: spacing.sm,
  },
  errorBlock: {
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.status.error,
  },
  webActions: {
    gap: spacing.sm,
  },
});
