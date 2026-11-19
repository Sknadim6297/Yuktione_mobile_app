import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/brand';
import { signInThenReturn } from '@/features/auth/postAuthRoute';
import { openDates, rupees, isPayable, monthKey, useExpertAvailability } from '@/features/booking/bookingData';
import { BookingDone } from '@/features/booking/BookingDone';
import { BookingReview } from '@/features/booking/BookingReview';
import { ChosenSessions, DatePicker, PlanPicker, TimePicker, type DraftPick } from '@/features/booking/BookingSchedule';
import { Banner, ExpertStrip, Stepper, type BookingStep } from '@/features/booking/bookingUi';
import { RazorpayCheckout } from '@/features/booking/RazorpayCheckout';
import type { CheckoutFailure } from '@/features/booking/razorpay';
import { Skeleton } from '@/features/customer/home/media';
import { useCustomerState } from '@/features/customer/store';
import { IconButton } from '@/features/customer/ui';
import { StatePanel } from '@/features/experts/ExpertsDirectoryScreen';
import { EXPERTS_LIVE, useExpertDetail } from '@/features/experts/expertsDirectory';
import {
  BookingRequestError,
  createBookingOrder,
  fetchBookingCheckout,
  reportPaymentFailure,
  verifyBookingPayment,
  type BookingCheckout,
  type BookingSelection,
  type ConfirmedBooking,
  type RazorpayOrder,
  type RazorpaySuccess,
} from '@/services/api/booking';
import type { ApiSessionRate } from '@/services/api/catalog';
import { openOriginPath } from '@/services/website/openWebsite';
import { brand, customer, customerFonts, shadows } from '@/theme';

const MAX_FRAME = 720;

type Notice = { tone: 'error' | 'info'; text: string; action?: { label: string; onPress: () => void } } | null;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/experts');
}

/**
 * In-app booking — the website's expert booking: plan → one date per session with one
 * time each → summary with GST → Razorpay → confirmation and the expert's questionnaire.
 */
export function BookSessionFlowScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = Math.min(width, MAX_FRAME);
  const queryClient = useQueryClient();
  const session = useCustomerState().session;
  const signedIn = session?.source === 'api';

  const detail = useExpertDetail(id);
  const availability = useExpertAvailability(id);
  const expert = detail.data;
  const rates = useMemo(() => expert?.session_rates ?? [], [expert]);
  const dates = useMemo(() => openDates(availability.data?.dates), [availability.data]);

  const [step, setStep] = useState<BookingStep>('schedule');
  const [chosenRate, setRate] = useState<ApiSessionRate | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [chosenMonth, setMonth] = useState<string | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [checkout, setCheckout] = useState<BookingCheckout | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string>();
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const lastFailure = useRef<CheckoutFailure | null>(null);
  const paidWith = useRef<RazorpaySuccess | null>(null);
  const scroller = useRef<ScrollViewInstance>(null);

  const rate = chosenRate ?? rates.find(isPayable) ?? null;
  const month = chosenMonth ?? (dates[0] ? monthKey(dates[0].date) : null);
  const sessions = Math.max(1, rate?.num_sessions ?? 1);
  const ready = Boolean(rate) && picks.length === sessions && picks.every((pick) => pick.slot);
  const selection = (): BookingSelection | null =>
    rate && expert
      ? {
          professional_id: expert.id,
          rate_id: rate.id,
          slots: picks.map((pick) => ({ date: pick.date, time_slot: pick.slot ?? '' })),
        }
      : null;

  const toTop = () => scroller.current?.scrollTo({ y: 0, animated: true });

  const goBack = () => {
    if (order) return;
    if (step === 'review') {
      setStep('schedule');
      setNotice(null);
      return;
    }
    leave();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'review' || order) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  });

  const handleError = (error: unknown, fallback: string) => {
    if (error instanceof BookingRequestError && error.code === 'terms_required') {
      setNotice({
        tone: 'error',
        text: error.message,
        action: { label: 'Open YuktiOne website', onPress: () => void openOriginPath('/terms/accept') },
      });
      return;
    }
    setNotice({ tone: 'error', text: error instanceof Error ? error.message : fallback });
  };

  const review = useMutation({
    mutationFn: (body: BookingSelection) => fetchBookingCheckout(body),
    onSuccess: (data) => {
      setCheckout(data);
      setPhone((current) => current || data.customer.phone || '');
      setNotice(null);
      setStep('review');
      toTop();
    },
    onError: (error) => {
      handleError(error, "We couldn't prepare your booking.");
      if (error instanceof BookingRequestError && error.status === 422) {
        void availability.refetch();
      }
      toTop();
    },
  });

  const startOrder = useMutation({
    mutationFn: ({ body, mobile }: { body: BookingSelection; mobile: string }) => createBookingOrder(body, mobile),
    onSuccess: (data) => {
      lastFailure.current = null;
      setNotice(null);
      setOrder(data);
    },
    onError: (error) => handleError(error, "We couldn't start the payment."),
  });

  const verify = useMutation({
    mutationFn: (payment: RazorpaySuccess) => verifyBookingPayment(payment),
    onSuccess: (booking) => {
      setConfirmed(booking);
      setNotice(null);
      setStep('done');
      toTop();
      void queryClient.invalidateQueries({ queryKey: ['v1', 'my'] });
      void queryClient.invalidateQueries({ queryKey: ['v1', 'experts', 'availability', id] });
    },
    onError: (error) => {
      const paymentId = paidWith.current?.razorpay_payment_id;
      setNotice({
        tone: 'error',
        text: `${error.message}${paymentId ? ` Payment ID: ${paymentId}.` : ''}`,
        action: paidWith.current
          ? { label: 'Try confirming again', onPress: () => paidWith.current && verify.mutate(paidWith.current) }
          : undefined,
      });
    },
  });

  const onDay = (date: string) => {
    setCalendarNotice(null);
    if (picks.some((pick) => pick.date === date)) {
      setActiveDate(date);
      return;
    }
    if (picks.length >= sessions) {
      setCalendarNotice(
        sessions === 1
          ? 'You already picked a date. Remove it below to choose another.'
          : `You've picked all ${sessions} dates. Remove one below to choose another.`,
      );
      return;
    }
    setPicks((current) => [...current, { date, slot: null }].sort((a, b) => a.date.localeCompare(b.date)));
    setActiveDate(date);
  };

  const onSlot = (value: string) => {
    if (!activeDate) return;
    setPicks((current) => current.map((pick) => (pick.date === activeDate ? { ...pick, slot: value } : pick)));
    const nextOpen = picks.find((pick) => pick.date !== activeDate && !pick.slot);
    if (nextOpen) setActiveDate(nextOpen.date);
  };

  const onRemove = (date: string) => {
    setCalendarNotice(null);
    setPicks((current) => current.filter((pick) => pick.date !== date));
    if (activeDate === date) setActiveDate(null);
  };

  const onPlan = (next: ApiSessionRate) => {
    setRate(next);
    setCalendarNotice(null);
    setPicks((current) => current.slice(0, Math.max(1, next.num_sessions)));
  };

  const continueToReview = () => {
    if (!signedIn) {
      signInThenReturn({ pathname: '/experts/book/[id]', params: { id } });
      return;
    }
    const body = selection();
    if (body) review.mutate(body);
  };

  const pay = () => {
    const body = selection();
    if (!body) return;
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Enter a 10-digit mobile number.');
      return;
    }
    setPhoneError(undefined);
    startOrder.mutate({ body, mobile: phone });
  };

  const onPaid = (payment: RazorpaySuccess) => {
    paidWith.current = payment;
    verify.mutate(payment);
  };

  const onPaymentFailed = (failure: CheckoutFailure) => {
    lastFailure.current = failure;
    if (order) void reportPaymentFailure({ ...failure, razorpay_order_id: order.id }).catch(() => undefined);
  };

  const onCheckoutClosed = (reason: 'dismissed' | 'paid' | 'unavailable') => {
    setOrder(null);
    if (reason === 'paid') return;
    if (reason === 'unavailable') {
      setNotice({ tone: 'error', text: "Razorpay couldn't open. Check your internet connection and try again." });
      return;
    }
    const failure = lastFailure.current;
    setNotice(
      failure
        ? {
            tone: 'error',
            text: `Payment didn't go through${failure.error_description ? `: ${failure.error_description}` : '.'} If money was deducted, it is refunded automatically. You can try again.`,
          }
        : { tone: 'info', text: "Payment was cancelled. You haven't been charged." },
    );
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.frame, styles.headerRow, { width: frame }]}>
        {step !== 'done' ? <IconButton icon="chevron-back" label="Go back" onPress={goBack} /> : <View style={styles.headerSpacer} />}
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {step === 'done' ? 'Booking confirmed' : 'Book a session'}
        </Text>
        {step === 'done' ? (
          <IconButton icon="close" label="Close" onPress={leave} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      <View style={[styles.frame, styles.stepperWrap, { width: frame }]}>
        <Stepper step={step} />
      </View>
    </View>
  );

  if (!EXPERTS_LIVE || !/^\d+$/.test(id) || (detail.isError && (detail.error as { status?: number }).status === 404)) {
    return (
      <View style={styles.page}>
        {header}
        <View style={styles.center}>
          <StatePanel
            icon="person-outline"
            title="This expert isn't available"
            body="The expert may no longer be listed on YuktiOne. Browse other experts instead."
            primary={{ label: 'Browse experts', onPress: () => router.replace('/(tabs)/experts') }}
          />
        </View>
      </View>
    );
  }

  if (detail.isError || availability.isError) {
    return (
      <View style={styles.page}>
        {header}
        <View style={styles.center}>
          <StatePanel
            icon="cloud-offline-outline"
            title="We couldn't load booking times"
            body={(detail.error ?? availability.error)?.message ?? 'Please try again.'}
            primary={{
              label: 'Try again',
              onPress: () => {
                void detail.refetch();
                void availability.refetch();
              },
            }}
          />
        </View>
      </View>
    );
  }

  if (!expert || !availability.data) {
    return (
      <View style={styles.page} accessibilityLabel="Loading booking">
        {header}
        <View style={[styles.frame, styles.body, { width: frame }]}>
          <Skeleton style={{ width: '100%', height: 76, borderRadius: 20 }} />
          <Skeleton style={{ width: '100%', height: 170, borderRadius: 22 }} />
          <Skeleton style={{ width: '100%', height: 320, borderRadius: 22 }} />
        </View>
      </View>
    );
  }

  const bookableRates = rates.filter(isPayable);
  if (!bookableRates.length || !dates.length) {
    return (
      <View style={styles.page}>
        {header}
        <View style={styles.center}>
          <StatePanel
            icon="calendar-clear-outline"
            title={!bookableRates.length ? 'No bookable plans yet' : 'No open times right now'}
            body={
              !bookableRates.length
                ? `${expert.name} hasn't published a plan that can be booked online yet.`
                : `${expert.name} has no open session times at the moment. Please check again soon.`
            }
            primary={{ label: 'Back to profile', onPress: leave }}
            secondary={{ label: 'Browse other experts', onPress: () => router.replace('/(tabs)/experts') }}
          />
        </View>
      </View>
    );
  }

  const activeDay = activeDate ? (availability.data.dates.find((day) => day.date === activeDate) ?? null) : null;
  const footerHeight = 84 + Math.max(insets.bottom, 12);

  let footer: React.ReactNode = null;
  if (step === 'schedule') {
    const remaining = sessions - picks.filter((pick) => pick.slot).length;
    footer = (
      <>
        <View style={styles.footerPrice}>
          <Text style={styles.footerLabel}>{rate ? `${rate.session_type} plan` : 'Select a plan'}</Text>
          <Text style={styles.footerAmount}>
            {rate ? rupees(rate.final_rate) : '—'} <Text style={styles.footerSuffix}>+ GST</Text>
          </Text>
        </View>
        <View style={styles.flexFill}>
          <PrimaryButton
            label={!signedIn ? 'Sign in to continue' : ready ? 'Continue' : remaining === 1 ? 'Pick 1 more' : `Pick ${remaining} more`}
            icon={signedIn ? 'arrow-forward' : 'log-in-outline'}
            iconPosition={signedIn ? 'end' : 'start'}
            onPress={continueToReview}
            disabled={signedIn && !ready}
            loading={review.isPending}
          />
        </View>
      </>
    );
  } else if (step === 'review' && checkout) {
    footer = (
      <>
        <View style={styles.footerPrice}>
          <Text style={styles.footerLabel}>Total incl. GST</Text>
          <Text style={styles.footerAmount}>{rupees(checkout.amounts.total)}</Text>
        </View>
        <View style={styles.flexFill}>
          <PrimaryButton
            label={verify.isPending ? 'Confirming…' : `Pay ${rupees(checkout.amounts.total)}`}
            icon="lock-closed"
            onPress={pay}
            loading={startOrder.isPending || verify.isPending || Boolean(order)}
          />
        </View>
      </>
    );
  } else if (step === 'done') {
    footer = (
      <>
        <View style={styles.flexFill}>
          <SecondaryButton label="Done" onPress={leave} />
        </View>
        <View style={styles.flexFill}>
          <PrimaryButton label="My bookings" icon="calendar" onPress={() => router.replace('/(tabs)/bookings')} />
        </View>
      </>
    );
  }

  return (
    <View style={styles.page}>
      {header}
      <ScrollView
        ref={scroller}
        contentContainerStyle={{ paddingBottom: footerHeight + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.frame, styles.body, { width: frame }]}>
          {step !== 'done' ? <ExpertStrip expert={expert} /> : null}
          {notice ? <Banner tone={notice.tone} text={notice.text} action={notice.action} /> : null}

          {step === 'schedule' ? (
            <>
              <PlanPicker rates={rates} selectedId={rate?.id ?? null} onSelect={onPlan} />
              <DatePicker
                sessions={sessions}
                durations={availability.data.session_durations}
                dates={dates}
                picks={picks}
                activeDate={activeDate}
                month={month ?? monthKey(dates[0]!.date)}
                notice={calendarNotice}
                onMonth={setMonth}
                onDay={onDay}
              />
              {activeDay ? (
                <TimePicker day={activeDay} selected={picks.find((pick) => pick.date === activeDay.date)?.slot ?? null} onSelect={onSlot} />
              ) : null}
              <ChosenSessions picks={picks} dates={availability.data.dates} activeDate={activeDate} onOpen={setActiveDate} onRemove={onRemove} />
            </>
          ) : null}

          {step === 'review' && checkout ? (
            <BookingReview checkout={checkout} phone={phone} phoneError={phoneError} onPhone={setPhone} />
          ) : null}

          {step === 'done' && confirmed ? <BookingDone booking={confirmed} /> : null}
        </View>
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={[styles.frame, styles.footerRow]}>{footer}</View>
        </View>
      ) : null}

      <RazorpayCheckout order={order} onSuccess={onPaid} onFailure={onPaymentFailed} onClose={onCheckoutClosed} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customer.canvas },
  frame: { alignSelf: 'center', maxWidth: '100%' },
  flexFill: { flex: 1, minWidth: 0 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
  header: {
    paddingBottom: 12,
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.divider,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: customerFonts.bold, fontSize: 17, color: brand.ink },
  headerSpacer: { width: 44, height: 44 },
  stepperWrap: { paddingHorizontal: 16, marginTop: 10 },
  body: { padding: 16, gap: 14 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.divider,
    ...shadows.md,
  },
  footerRow: { width: '100%', maxWidth: MAX_FRAME - 32, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerPrice: { gap: 1, flexShrink: 0 },
  footerLabel: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey, textTransform: 'capitalize' },
  footerAmount: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.ink },
  footerSuffix: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey },
});
