import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandGradient, PrimaryButton } from '@/components/brand';
import { Banner, StepCard, SummaryRow, bookingStyles } from '@/features/booking/bookingUi';
import { PriceBreakdown, SessionList } from '@/features/booking/BookingReview';
import { Skeleton } from '@/features/customer/home/media';
import {
  fetchBookingQuestions,
  submitBookingAnswers,
  type BookingQuestion,
  type ConfirmedBooking,
} from '@/services/api/booking';
import { brand, customerFonts, shadows } from '@/theme';

const OTHER = 'Other';

export function BookingDone({ booking }: { booking: ConfirmedBooking }) {
  return (
    <>
      <View style={styles.hero}>
        <BrandGradient colors={[brand.plumDeep, brand.plum, brand.magenta]} angle={135} style={styles.heroBg} />
        <View style={styles.heroIcon}>
          <Ionicons name="checkmark" size={34} color={brand.plum} />
        </View>
        <Text style={styles.heroTitle} accessibilityRole="header">
          Booking confirmed
        </Text>
        <Text style={styles.heroBody}>
          Your {booking.sessions.length === 1 ? 'session' : 'sessions'}
          {booking.professional.name ? ` with ${booking.professional.name}` : ''} {booking.sessions.length === 1 ? 'is' : 'are'} booked. A
          confirmation email is on its way.
        </Text>
      </View>

      <StepCard icon="calendar-outline" title="Your sessions" hint="Join from My Bookings when it's time.">
        <SessionList sessions={booking.sessions} />
      </StepCard>

      <StepCard icon="wallet-outline" title="Payment">
        <PriceBreakdown amounts={booking.amounts} totalLabel="Amount paid" />
        <SummaryRow label="Payment ID" value={booking.payment_id} />
      </StepCard>

      {booking.has_questions ? <Questionnaire bookingId={booking.id} /> : null}
    </>
  );
}

type Draft = Record<number, { answer: string; other: string }>;

function Questionnaire({ bookingId }: { bookingId: number }) {
  const questions = useQuery({
    queryKey: ['v1', 'bookings', bookingId, 'questions'],
    queryFn: () => fetchBookingQuestions(bookingId),
  });
  const [draft, setDraft] = useState<Draft>({});
  const submit = useMutation({
    mutationFn: () =>
      submitBookingAnswers(
        bookingId,
        Object.entries(draft)
          .filter(([, value]) => value.answer.trim())
          .map(([id, value]) => ({
            mcq_id: Number(id),
            answer: value.answer.trim(),
            other_answer: value.answer === OTHER ? value.other.trim() || null : null,
          })),
      ),
  });

  const set = (id: number, patch: Partial<{ answer: string; other: string }>) =>
    setDraft((current) => ({ ...current, [id]: { answer: '', other: '', ...current[id], ...patch } }));
  const answered = Object.values(draft).filter((value) => value.answer.trim()).length;

  if (questions.isLoading) {
    return <Skeleton style={styles.skeleton} />;
  }
  if (questions.isError || !questions.data?.length) return null;

  if (submit.isSuccess) {
    return (
      <StepCard icon="chatbubbles-outline" title="Help your expert prepare">
        <Banner tone="success" text={submit.data} />
      </StepCard>
    );
  }

  return (
    <StepCard
      icon="chatbubbles-outline"
      title="Help your expert prepare"
      hint="A few optional questions. Your answers are shared only with your expert."
    >
      {questions.data.map((question, index) => (
        <QuestionField key={question.id} index={index} question={question} value={draft[question.id]} onChange={(patch) => set(question.id, patch)} />
      ))}
      {submit.isError ? <Banner tone="error" text={submit.error.message} /> : null}
      <PrimaryButton
        label="Share answers"
        icon="send"
        onPress={() => submit.mutate()}
        disabled={answered === 0}
        loading={submit.isPending}
      />
    </StepCard>
  );
}

function QuestionField({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: BookingQuestion;
  value: { answer: string; other: string } | undefined;
  onChange: (patch: Partial<{ answer: string; other: string }>) => void;
}) {
  const options = question.has_other && !question.options.includes(OTHER) ? [...question.options, OTHER] : question.options;
  return (
    <View style={styles.question}>
      <Text style={styles.questionText}>
        {index + 1}. {question.question}
      </Text>
      {question.type === 'text' || !options.length ? (
        <TextInput
          value={value?.answer ?? ''}
          onChangeText={(answer) => onChange({ answer })}
          placeholder="Type your answer"
          placeholderTextColor="#A8A1A6"
          multiline
          maxLength={1000}
          accessibilityLabel={question.question}
          style={styles.textArea}
        />
      ) : (
        <View style={styles.options} accessibilityRole="radiogroup">
          {options.map((option) => {
            const on = value?.answer === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => onChange({ answer: option })}
                style={({ pressed }) => [bookingStyles.pill, styles.option, on && bookingStyles.pillOn, pressed && styles.pressed]}
              >
                <Text style={[bookingStyles.pillText, on && bookingStyles.pillTextOn]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {value?.answer === OTHER ? (
        <TextInput
          value={value.other}
          onChangeText={(other) => onChange({ other })}
          placeholder="Tell us more"
          placeholderTextColor="#A8A1A6"
          maxLength={1000}
          accessibilityLabel={`${question.question}, other answer`}
          style={styles.textArea}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: 26,
    overflow: 'hidden',
    ...shadows.brand,
  },
  heroBg: { borderRadius: 26 },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
    marginBottom: 4,
  },
  heroTitle: { fontFamily: customerFonts.bold, fontSize: 22, color: brand.white },
  heroBody: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.92)', textAlign: 'center' },
  skeleton: { width: '100%', height: 160, borderRadius: 22 },
  question: { gap: 10 },
  questionText: { fontFamily: customerFonts.semibold, fontSize: 14.5, lineHeight: 21, color: brand.ink },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 40 },
  textArea: {
    minHeight: 48,
    maxHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.silver,
    backgroundColor: brand.white,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: brand.ink,
    textAlignVertical: 'top',
  },
});
