import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { FormInput } from '@/components/brand';
import { rupees, sessionsLabel, shortDate } from '@/features/booking/bookingData';
import { StepCard, SummaryRow } from '@/features/booking/bookingUi';
import type { BookingAmounts, BookingCheckout, BookingPick } from '@/services/api/booking';
import { brand, customerFonts } from '@/theme';

export function SessionList({ sessions }: { sessions: BookingPick[] }) {
  return (
    <View style={styles.sessions}>
      {sessions.map((session, index) => (
        <View key={`${session.date}-${session.time_slot}`} style={styles.session}>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>{index + 1}</Text>
          </View>
          <View style={styles.flexFill}>
            <Text style={styles.sessionDate}>{shortDate(session.date)}</Text>
            <Text style={styles.sessionTime}>{session.time_slot.replace(' - ', ' – ')}</Text>
          </View>
          <Ionicons name="videocam-outline" size={17} color={brand.plum} />
        </View>
      ))}
    </View>
  );
}

export function PriceBreakdown({ amounts, totalLabel }: { amounts: BookingAmounts; totalLabel: string }) {
  return (
    <View style={styles.prices}>
      <SummaryRow label="Session fee" value={rupees(amounts.base_amount)} />
      <SummaryRow label="CGST (9%)" value={rupees(amounts.cgst)} />
      <SummaryRow label="SGST (9%)" value={rupees(amounts.sgst)} />
      {amounts.igst > 0 ? <SummaryRow label="IGST" value={rupees(amounts.igst)} /> : null}
      <View style={styles.divider} />
      <SummaryRow label={totalLabel} value={rupees(amounts.total)} strong />
    </View>
  );
}

export function BookingReview({
  checkout,
  phone,
  phoneError,
  onPhone,
}: {
  checkout: BookingCheckout;
  phone: string;
  phoneError?: string;
  onPhone: (value: string) => void;
}) {
  return (
    <>
      <StepCard
        icon="receipt-outline"
        title="Booking summary"
        hint={`${checkout.plan_label} plan · ${sessionsLabel(checkout.num_sessions)} · Online`}
      >
        {checkout.service_name ? <SummaryRow label="Service" value={checkout.service_name} /> : null}
        <SummaryRow label="Expert" value={checkout.professional.name} />
        <SessionList sessions={checkout.bookings} />
      </StepCard>

      <StepCard icon="person-outline" title="Your details" hint="Your expert and our team use these to reach you.">
        <SummaryRow label="Name" value={checkout.customer.name} />
        <SummaryRow label="Email" value={checkout.customer.email} />
        <FormInput
          label="Mobile number"
          icon="call-outline"
          value={phone}
          onChangeText={(value) => onPhone(value.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={10}
          placeholder="10-digit mobile number"
          error={phoneError}
          accessibilityLabel="Mobile number"
        />
      </StepCard>

      <StepCard icon="wallet-outline" title="Price details">
        <PriceBreakdown amounts={checkout.amounts} totalLabel="Total payable" />
        <View style={styles.secure}>
          <Ionicons name="lock-closed" size={14} color="#067647" />
          <Text style={styles.secureText}>Secure payment by Razorpay · UPI, cards, net banking and wallets</Text>
        </View>
      </StepCard>
    </>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1, minWidth: 0 },
  sessions: { gap: 8 },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FBF7F9',
    borderWidth: 1,
    borderColor: brand.divider,
  },
  sessionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plum,
  },
  sessionBadgeText: { fontFamily: customerFonts.bold, fontSize: 12.5, color: brand.white },
  sessionDate: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  sessionTime: { fontFamily: customerFonts.medium, fontSize: 13, color: '#3D3D4A' },
  prices: { gap: 10 },
  divider: { height: 1, backgroundColor: brand.divider, marginVertical: 2 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 12, lineHeight: 17, color: '#067647' },
});
