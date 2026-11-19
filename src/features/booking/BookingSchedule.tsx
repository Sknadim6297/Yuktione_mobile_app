import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CALENDAR_HEADINGS,
  isPayable,
  longDate,
  monthCells,
  monthKey,
  monthTitle,
  planTitle,
  rupees,
  sessionsLabel,
  shiftMonth,
  shortDate,
} from '@/features/booking/bookingData';
import { Banner, StepCard, bookingStyles } from '@/features/booking/bookingUi';
import type { BookableDate } from '@/services/api/booking';
import type { ApiSessionRate } from '@/services/api/catalog';
import { brand, customerFonts } from '@/theme';

export type DraftPick = { date: string; slot: string | null };

export function PlanPicker({
  rates,
  selectedId,
  onSelect,
}: {
  rates: ApiSessionRate[];
  selectedId: number | null;
  onSelect: (rate: ApiSessionRate) => void;
}) {
  return (
    <StepCard icon="layers-outline" title="Choose a session plan" hint="Prices are before GST (18%).">
      <View style={styles.plans} accessibilityRole="radiogroup">
        {rates.map((rate) => {
          const selected = rate.id === selectedId;
          const payable = isPayable(rate);
          const meta = [
            sessionsLabel(rate.num_sessions),
            rate.num_sessions > 1 && rate.rate_per_session > 0 ? `${rupees(rate.rate_per_session)} each` : null,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <Pressable
              key={rate.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: !payable }}
              accessibilityLabel={`${planTitle(rate)}, ${meta}, ${payable ? rupees(rate.final_rate) : 'not bookable online'}`}
              disabled={!payable}
              onPress={() => onSelect(rate)}
              style={({ pressed }) => [
                styles.plan,
                selected && styles.planOn,
                !payable && styles.planOff,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
              <View style={styles.flexFill}>
                <Text style={styles.planTitle}>{planTitle(rate)}</Text>
                <Text style={styles.planMeta}>{meta}</Text>
                {rate.features?.length ? (
                  <Text style={styles.planFeatures} numberOfLines={2}>
                    {rate.features.join(' · ')}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.planPrice, !payable && styles.planPriceOff]}>
                {payable ? rupees(rate.final_rate) : 'Not online'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </StepCard>
  );
}

export function DatePicker({
  sessions,
  durations,
  dates,
  picks,
  activeDate,
  month,
  notice,
  onMonth,
  onDay,
}: {
  sessions: number;
  durations: number[];
  dates: BookableDate[];
  picks: DraftPick[];
  activeDate: string | null;
  month: string;
  notice: string | null;
  onMonth: (key: string) => void;
  onDay: (date: string) => void;
}) {
  const open = useMemo(() => new Map(dates.map((day) => [day.date, day])), [dates]);
  const picked = useMemo(() => new Set(picks.map((pick) => pick.date)), [picks]);
  const first = dates[0] ? monthKey(dates[0].date) : month;
  const last = dates.length ? monthKey(dates[dates.length - 1]!.date) : month;
  const cells = monthCells(month);
  const hint = [
    sessions === 1 ? 'Pick one date.' : `Pick ${sessions} different dates, one for each session.`,
    durations.length ? `Each session is ${durations.join(' / ')} mins.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <StepCard icon="calendar-outline" title={sessions === 1 ? 'Pick a date' : `Pick ${sessions} dates`} hint={hint}>
      <View style={styles.monthBar}>
        <MonthArrow icon="chevron-back" label="Previous month" disabled={month <= first} onPress={() => onMonth(shiftMonth(month, -1))} />
        <Text style={styles.monthTitle} accessibilityRole="header">
          {monthTitle(month)}
        </Text>
        <MonthArrow icon="chevron-forward" label="Next month" disabled={month >= last} onPress={() => onMonth(shiftMonth(month, 1))} />
      </View>
      <View style={styles.grid}>
        {CALENDAR_HEADINGS.map((day) => (
          <Text key={day} style={styles.heading}>
            {day.slice(0, 2)}
          </Text>
        ))}
        {cells.map((date, index) => {
          if (!date) return <View key={`pad-${index}`} style={styles.cell} />;
          const day = open.get(date);
          const free = day ? day.slots.filter((slot) => !slot.booked).length : 0;
          const isPicked = picked.has(date);
          const isActive = date === activeDate;
          const enabled = free > 0 || isPicked;
          return (
            <View key={date} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${longDate(date)}${enabled ? `, ${free} ${free === 1 ? 'time' : 'times'} open` : ', unavailable'}${isPicked ? ', selected' : ''}`}
                accessibilityState={{ disabled: !enabled, selected: isPicked }}
                disabled={!enabled}
                onPress={() => onDay(date)}
                style={({ pressed }) => [
                  styles.day,
                  enabled && styles.dayOpen,
                  isPicked && styles.dayPicked,
                  isActive && styles.dayActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.dayText, enabled && styles.dayTextOpen, isPicked && styles.dayTextPicked]}>
                  {Number(date.slice(8))}
                </Text>
                {enabled && !isPicked ? <View style={styles.dayDot} /> : null}
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Legend swatch={[styles.legendSwatch, styles.dayOpen]} label="Available" />
        <Legend swatch={[styles.legendSwatch, styles.dayPicked]} label="Your dates" />
        <Text style={styles.counter}>
          {picks.length}/{sessions} chosen
        </Text>
      </View>
      {notice ? <Banner tone="info" text={notice} /> : null}
    </StepCard>
  );
}

export function TimePicker({
  day,
  selected,
  onSelect,
}: {
  day: BookableDate;
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <StepCard icon="time-outline" title={`Times on ${shortDate(day.date)}`} hint="India time (IST). Booked times can't be chosen.">
      <View style={styles.slots} accessibilityRole="radiogroup">
        {day.slots.map((slot) => {
          const on = slot.value === selected;
          const [start, end] = slot.label.split(' - ');
          return (
            <Pressable
              key={slot.value}
              accessibilityRole="radio"
              accessibilityLabel={`${slot.label}${slot.booked ? ', already booked' : ''}`}
              accessibilityState={{ checked: on, disabled: slot.booked }}
              disabled={slot.booked}
              onPress={() => onSelect(slot.value)}
              style={({ pressed }) => [
                bookingStyles.pill,
                styles.slot,
                on && bookingStyles.pillOn,
                slot.booked && styles.slotBooked,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[bookingStyles.pillText, styles.slotText, on && bookingStyles.pillTextOn, slot.booked && styles.slotTextBooked]}>
                {start}
              </Text>
              <Text style={[styles.slotEnd, on && styles.slotEndOn, slot.booked && styles.slotTextBooked]}>
                {slot.booked ? 'Booked' : end ? `till ${end}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </StepCard>
  );
}

export function ChosenSessions({
  picks,
  dates,
  activeDate,
  onOpen,
  onRemove,
}: {
  picks: DraftPick[];
  dates: BookableDate[];
  activeDate: string | null;
  onOpen: (date: string) => void;
  onRemove: (date: string) => void;
}) {
  if (!picks.length) return null;
  const labelOf = (pick: DraftPick) =>
    dates.find((day) => day.date === pick.date)?.slots.find((slot) => slot.value === pick.slot)?.label ?? null;
  return (
    <StepCard icon="checkmark-done-outline" title="Your sessions">
      <View style={styles.chosen}>
        {picks.map((pick, index) => {
          const label = labelOf(pick);
          return (
            <View key={pick.date} style={[styles.chosenRow, pick.date === activeDate && styles.chosenRowActive]}>
              <Text style={styles.chosenIndex}>{index + 1}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Session ${index + 1}, ${longDate(pick.date)}, ${label ?? 'time not chosen'}. Change time`}
                onPress={() => onOpen(pick.date)}
                style={styles.flexFill}
              >
                <Text style={styles.chosenDate}>{shortDate(pick.date)}</Text>
                <Text style={[styles.chosenTime, !label && styles.chosenMissing]}>{label ?? 'Choose a time'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${shortDate(pick.date)}`}
                hitSlop={8}
                onPress={() => onRemove(pick.date)}
                style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={16} color={brand.grey} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </StepCard>
  );
}

function MonthArrow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, disabled && styles.arrowOff, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={18} color={disabled ? '#C9C3C7' : brand.plum} />
    </Pressable>
  );
}

function Legend({ swatch, label }: { swatch: object[]; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={swatch} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },

  plans: { gap: 10 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: brand.divider,
    backgroundColor: brand.white,
  },
  planOn: { borderColor: brand.plum, backgroundColor: brand.plumSoft },
  planOff: { opacity: 0.55 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C9C3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: brand.plum },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: brand.plum },
  planTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: brand.ink },
  planMeta: { fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 18, color: brand.grey },
  planFeatures: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: '#3D3D4A', marginTop: 2 },
  planPrice: { fontFamily: customerFonts.bold, fontSize: 16, color: brand.plum },
  planPriceOff: { fontSize: 12.5, color: brand.grey },

  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { fontFamily: customerFonts.bold, fontSize: 15.5, color: brand.ink },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plumSoft,
  },
  arrowOff: { backgroundColor: '#F6F3F5' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  heading: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    paddingVertical: 4,
    fontFamily: customerFonts.semibold,
    fontSize: 11.5,
    color: brand.grey,
  },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayOpen: { backgroundColor: brand.plumSoft, borderWidth: 1, borderColor: brand.plumSoftDeep },
  dayPicked: { backgroundColor: brand.plum, borderColor: brand.plum },
  dayActive: { borderWidth: 2, borderColor: brand.magenta },
  dayText: { fontFamily: customerFonts.medium, fontSize: 13.5, color: '#C2BBC0' },
  dayTextOpen: { fontFamily: customerFonts.bold, color: brand.plum },
  dayTextPicked: { color: brand.white },
  dayDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: brand.plum },
  legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 5 },
  legendText: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey },
  counter: { marginLeft: 'auto', fontFamily: customerFonts.bold, fontSize: 12.5, color: brand.plum },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { flexGrow: 1, flexBasis: '45%', maxWidth: '50%', minHeight: 54, paddingVertical: 8 },
  slotText: { fontSize: 15 },
  slotEnd: { fontFamily: customerFonts.regular, fontSize: 11.5, color: brand.grey },
  slotEndOn: { color: 'rgba(255,255,255,0.85)' },
  slotBooked: { backgroundColor: '#F6F3F5', borderColor: '#EEE8EC' },
  slotTextBooked: { color: '#A8A1A6', textDecorationLine: 'line-through' },

  chosen: { gap: 8 },
  chosenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FBF7F9',
    borderWidth: 1,
    borderColor: brand.divider,
  },
  chosenRowActive: { borderColor: brand.plum },
  chosenIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
    backgroundColor: brand.plum,
    color: brand.white,
    fontFamily: customerFonts.bold,
    fontSize: 12.5,
  },
  chosenDate: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  chosenTime: { fontFamily: customerFonts.medium, fontSize: 13, color: '#3D3D4A' },
  chosenMissing: { color: brand.magenta },
  remove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
});
